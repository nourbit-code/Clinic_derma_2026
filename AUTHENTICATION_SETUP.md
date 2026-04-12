# Authentication Setup Instructions

## Backend Setup

### 1. Install Required Dependencies
Navigate to the backend directory and install the new dependencies:

```bash
cd backend-1
pip install -r requirements.txt
```

This will install `django-cors-headers` which is required for the frontend to communicate with the backend.

### 2. Create Test Users in Database
Before you can login, you need to create at least one doctor and one receptionist in the database.

**Option A: Using Django Admin**
1. Run the server: `python manage.py runserver`
2. Go to http://127.0.0.1:8000/admin
3. Create a superuser if you haven't: `python manage.py createsuperuser`
4. Login and create Doctor and Receptionist records with email and password fields

**Option B: Using Django Shell**
```bash
python manage.py shell
```

Then run:
```python
from clinic.models import Doctor, Receptionist
from django.contrib.auth.models import User

# Create a doctor
doctor = Doctor.objects.create(
    name="Dr. John Smith",
    specialty="Dermatology",
    email="doctor@example.com",
    password="1234"
)

# Create a receptionist (first create a Django User)
user = User.objects.create_user(username='receptionist1', password='1234')
receptionist = Receptionist.objects.create(
    user=user,
    name="Jane Doe",
    email="reception@example.com",
    password="1234"
)

print("Users created successfully!")
```

### 3. Start the Backend Server
```bash
python manage.py runserver
```

The backend will be available at http://127.0.0.1:8000

## Frontend Setup

### 1. Install Dependencies
Navigate to the DermaSkincareApp directory:

```bash
cd DermaSkincareApp
npm install
```

This will install `axios` which is required for API communication.

### 2. Start the Expo Development Server
```bash
npm start
```

Or for specific platforms:
- Web: `npm run web`
- iOS: `npm run ios`
- Android: `npm run android`

## Testing the Login

1. Make sure the backend is running at http://127.0.0.1:8000
2. Start the frontend application
3. Try logging in with:
   - **Doctor**: email: `doctor@example.com`, password: `1234`
   - **Receptionist**: email: `reception@example.com`, password: `1234`

## API Endpoint Details

### Login Endpoint
- **URL**: `http://127.0.0.1:8000/api/login/`
- **Method**: POST
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password"
  }
  ```
- **Success Response** (200):
  ```json
  {
    "role": "doctor",
    "user": {
      "id": 1,
      "name": "Dr. John Smith",
      "email": "doctor@example.com",
      "specialty": "Dermatology"
    }
  }
  ```
- **Error Response** (401):
  ```json
  {
    "error": "Invalid email or password"
  }
  ```

## Troubleshooting

### CORS Errors
If you see CORS errors in the browser console:
- Make sure `django-cors-headers` is installed
- Check that the frontend URL matches one in `CORS_ALLOWED_ORIGINS` in settings.py
- Add your frontend's URL if running on a different port

### Connection Errors
If the frontend can't connect to the backend:
- Verify the backend is running on http://127.0.0.1:8000
- Check that the `API_BASE_URL` in `authApi.js` matches your backend URL
- Try accessing http://127.0.0.1:8000/api/doctors/ in your browser to test the API

### Database Issues
If you get database errors:
- Run migrations: `python manage.py migrate`
- Make sure you've created at least one Doctor and Receptionist user

## What Changed

### Backend Changes:
1. Added `django-cors-headers` to allow cross-origin requests
2. Created `/api/login/` endpoint that authenticates doctors and receptionists
3. Updated settings.py to include CORS configuration

### Frontend Changes:
1. Created `authApi.js` service for authentication
2. Updated login page to use the authentication service
3. Added loading state and proper error handling
4. Removed hardcoded mock users

## Security Note

**Important**: This implementation stores passwords in plain text for simplicity. In a production environment, you should:
- Use Django's built-in authentication system
- Hash passwords using `make_password()` and verify with `check_password()`
- Implement JWT or session-based authentication
- Use HTTPS for all communications
