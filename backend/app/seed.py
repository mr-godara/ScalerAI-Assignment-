import json
from app.database import SessionLocal
from app.models.hosted_zone import HostedZone, ZoneType
from app.models.dns_record import DnsRecord, RecordType, RoutingPolicy
from app.services.auth_service import AuthService

def seed_db():
    db = SessionLocal()
    try:
        user, created = AuthService.seed_demo_user(db, email="admin@route53.local", password="Admin1234!")
        if created:
            print("Demo user created.")
        else:
            print("Demo user already exists.")

        # Check if zones exist
        if db.query(HostedZone).count() > 0:
            print("Database already seeded with zones.")
            return

        zones_data = [
            {"name": "example.com.", "type": ZoneType.PUBLIC, "comment": "Primary example domain"},
            {"name": "internal.local.", "type": ZoneType.PRIVATE, "comment": "Internal VPC domain"},
            {"name": "staging.example.com.", "type": ZoneType.PUBLIC, "comment": "Staging environment"},
        ]

        zones = []
        for zd in zones_data:
            z = HostedZone(owner_id=user.id, name=zd["name"], type=zd["type"], comment=zd["comment"])
            db.add(z)
            zones.append(z)

        db.commit()
        for z in zones:
            db.refresh(z)

        z1, z2, z3 = zones

        records = [
            # Zone 1: example.com.
            DnsRecord(zone_id=z1.id, name="example.com.", type=RecordType.A, ttl=300, value=json.dumps(["93.184.216.34"]), routing_policy=RoutingPolicy.SIMPLE),
            DnsRecord(zone_id=z1.id, name="www.example.com.", type=RecordType.CNAME, ttl=300, value=json.dumps(["example.com."])),
            DnsRecord(zone_id=z1.id, name="example.com.", type=RecordType.MX, ttl=3600, value=json.dumps(["10 mail.example.com.", "20 mail2.example.com."])),
            DnsRecord(zone_id=z1.id, name="example.com.", type=RecordType.TXT, ttl=3600, value=json.dumps(["v=spf1 include:_spf.example.com ~all"])),
            DnsRecord(zone_id=z1.id, name="example.com.", type=RecordType.NS, ttl=172800, value=json.dumps(["ns1.route53.local.", "ns2.route53.local."])),
            
            # Zone 2: internal.local.
            DnsRecord(zone_id=z2.id, name="db.internal.local.", type=RecordType.A, ttl=60, value=json.dumps(["10.0.0.5"])),
            DnsRecord(zone_id=z2.id, name="cache.internal.local.", type=RecordType.CNAME, ttl=60, value=json.dumps(["redis.internal.local."])),
            DnsRecord(zone_id=z2.id, name="redis.internal.local.", type=RecordType.A, ttl=60, value=json.dumps(["10.0.0.10"])),
            
            # Zone 3: staging.example.com.
            DnsRecord(zone_id=z3.id, name="api.staging.example.com.", type=RecordType.A, ttl=300, value=json.dumps(["54.23.12.99"])),
            DnsRecord(zone_id=z3.id, name="staging.example.com.", type=RecordType.TXT, ttl=300, value=json.dumps(["env=staging"])),
        ]

        db.add_all(records)
        db.commit()
        
        # update record count
        for z in zones:
            z.record_count = len([r for r in records if r.zone_id == z.id])
            db.add(z)
        db.commit()
        
        print("Successfully seeded the database.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding DB: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
