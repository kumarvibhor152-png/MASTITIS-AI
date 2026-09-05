start cmd /k "cd ai-service && python -m uvicorn main:app --reload"
start cmd /k "cd backend && npm run dev"
start cmd /k "cd frontend && npm run dev"