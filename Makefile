dev-backend:
	cd backend && uvicorn app.main:app --reload

dev-frontend:
	cd frontend && npm run dev

seed:
	cd backend && python -c "from app.database import engine; from app.models import Base; Base.metadata.create_all(engine)" && python -m app.seed

migrate:
	cd backend && alembic upgrade head
