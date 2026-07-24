# API Routes

This document provides a reference for the HTTP routes implemented in CampusCompass, including authentication requirements, request parameters, redirect behavior, and expected responses.

---

# Route Protection

CampusCompass protects routes using Express middleware.

| Middleware                | Purpose                                                                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ensureGuest`             | Allows only unauthenticated (guest) users. Authenticated users are redirected to `/dashboard`.                                                          |
| `ensureAuth`              | Requires a valid session. Unauthenticated users are redirected to `/login`.                                                                             |
| `ensureProfileComplete`   | Requires a logged-in user with a completed profile. Redirects unauthenticated users to `/login` and users with incomplete profiles to `/profile/setup`. |
| `ensureProfileIncomplete` | Requires a logged-in user whose profile is **not** yet complete. Users with completed profiles are redirected to `/dashboard`.                          |

---

# Public Routes

## GET /

**Purpose**

Displays the CampusCompass landing page.

**Authentication**

Guest only.

**Request Body**

None.

**Response**

Renders the `landing` view.

**Redirect Behavior**

* Authenticated users → `/dashboard`

---

## GET /register

**Purpose**

Displays the registration page.

**Authentication**

Guest only.

**Request Body**

None.

**Response**

Renders the registration page.

**Redirect Behavior**

* Logged-in users → `/dashboard`

---

## POST /register

**Purpose**

Creates a new user account and starts a session.

**Authentication**

Guest only.

### Request Body

| Field             | Required | Description           |
| ----------------- | -------- | --------------------- |
| `email`           | Yes      | User email address    |
| `password`        | Yes      | Minimum 6 characters  |
| `confirmPassword` | Yes      | Must match `password` |

### Validation

* All fields are required.
* Password must contain at least 6 characters.
* Password and confirmation must match.
* Email address must not already exist.

### Success

* Creates a new user.
* Starts a session.
* Redirects to `/profile/setup`.

### Failure

Redirects back to `/register` with an error message when:

* Required fields are missing.
* Password is too short.
* Passwords do not match.
* Email already exists.
* An unexpected server error occurs.

---

## GET /login

**Purpose**

Displays the login page.

**Authentication**

Guest only.

**Request Body**

None.

**Response**

Renders the login page.

**Redirect Behavior**

* Logged-in users → `/dashboard`

---

## POST /login

**Purpose**

Authenticates an existing user.

**Authentication**

Guest only.

### Request Body

| Field      | Required |
| ---------- | -------- |
| `email`    | Yes      |
| `password` | Yes      |

### Validation

* Both fields are required.
* Email must exist.
* Password must match the stored password.

### Success

* Starts a session.
* Redirects to:

  * `/dashboard` if the profile is complete.
  * `/profile/setup` if onboarding has not been completed.

### Failure

Redirects back to `/login` if:

* Required fields are missing.
* Email or password is incorrect.
* A server error occurs.

---

## GET /logout

**Purpose**

Logs out the current user.

**Authentication**

Authenticated users only.

**Request Body**

None.

**Response**

Destroys the active session.

**Redirect Behavior**

Redirects to `/`.

---

# Profile Routes

## GET /profile/setup

**Purpose**

Displays the initial profile onboarding form.

**Authentication**

Requires:

* Logged-in user
* Profile not yet completed

**Request Body**

None.

**Redirect Behavior**

* Not logged in → `/login`
* Profile already complete → `/dashboard`

---

## POST /profile/setup

**Purpose**

Completes the user's profile during onboarding.

**Authentication**

Requires:

* Logged in
* Profile incomplete

### Request Body

| Field             | Required | Notes                 |
| ----------------- | -------- | --------------------- |
| `fullName`        | Yes      | Student's full name   |
| `collegeName`     | Yes      | College or university |
| `branch`          | Yes      | Academic branch       |
| `currentYear`     | Yes      | Current year of study |
| `careerGoal`      | Yes      | Desired career path   |
| `cgpa`            | No       | Parsed as a number    |
| `skills`          | No       | Comma-separated list  |
| `interests`       | No       | Comma-separated list  |
| `dailyStudyHours` | No       | Parsed as an integer  |

### Processing

* `skills` are converted into an array.
* `interests` are converted into an array.
* `cgpa` is stored as a numeric value.
* `dailyStudyHours` is stored as an integer.
* Existing GitHub and LeetCode usernames are preserved.
* `isProfileComplete` is set to `true`.

### Success

* Saves the profile.
* Marks onboarding as complete.
* Redirects to `/dashboard`.

### Failure

Redirects back to `/profile/setup` if:

* Required fields are missing.
* User no longer exists.
* A server error occurs.

---

# Dashboard

## GET /dashboard

**Purpose**

Displays the authenticated user dashboard.

**Authentication**

Requires:

* Active session
* Completed profile

**Request Body**

None.

**Redirect Behavior**

* Not logged in → `/login`
* Profile incomplete → `/profile/setup`

---

# Additional Routes

The application currently exposes several additional routes outside the scope of the onboarding flow.

| Method | Route         | Authentication                                                        |
| ------ | ------------- | --------------------------------------------------------------------- |
| GET    | `/social`     | Completed profile required                                            |
| GET    | `/discussion` | Completed profile required                                            |
| GET    | `/privacy`    | Public                                                                |
| GET    | `/terms`      | Public                                                                |
| GET    | `/resources`  | Public (logged-in users are redirected to `/dashboard?tab=resources`) |
| GET    | `/playlists`  | Public                                                                |

---

# Mock OAuth Routes

CampusCompass includes mock authentication flows for development.

## GET /auth/:platform

Displays a mock OAuth authorization page.

Supported platforms:

* `github`
* `leetcode`

Invalid platforms redirect to `/login`.

---

## POST /auth/:platform

Simulates OAuth authentication.

### Request Body

| Field      | Required |
| ---------- | -------- |
| `username` | Yes      |

### Behavior

* Creates a new user automatically if one does not already exist.
* Uses a simulated email address based on the username and provider.
* Stores the connected GitHub or LeetCode username.
* Starts a session.

### Redirect Behavior

| Condition                        | Redirect          |
| -------------------------------- | ----------------- |
| Profile complete                 | `/dashboard`      |
| Profile incomplete               | `/profile/setup`  |
| Missing username                 | `/auth/:platform` |
| Invalid provider or server error | `/login`          |
