import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_dns_validation():
    # We can't really test the full endpoints easily without seeding the DB and getting a token,
    # but we can test the Pydantic schemas directly.
    from app.schemas.dns_record import DnsRecordCreate, RecordType
    
    # Valid A record
    record = DnsRecordCreate(
        name="www",
        type=RecordType.A,
        value=["1.2.3.4", "5.6.7.8"]
    )
    assert record.value == ["1.2.3.4", "5.6.7.8"]

    # Invalid A record
    try:
        DnsRecordCreate(
            name="www",
            type=RecordType.A,
            value=["1.2.3.4", "invalid-ip"]
        )
        assert False, "Should have raised ValueError"
    except ValueError as e:
        assert "Invalid IPv4 address" in str(e)

    # Valid CNAME
    record = DnsRecordCreate(
        name="www",
        type=RecordType.CNAME,
        value=["example.com."]
    )
    assert record.value == ["example.com."]

    # Invalid CNAME (multiple values)
    try:
        DnsRecordCreate(
            name="www",
            type=RecordType.CNAME,
            value=["example.com", "example.org"]
        )
        assert False, "Should have raised ValueError"
    except ValueError as e:
        assert "exactly 1 value" in str(e)
        
    print("All Pydantic schema validation tests passed!")

if __name__ == "__main__":
    test_dns_validation()
