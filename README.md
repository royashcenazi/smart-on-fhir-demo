# SMART on FHIR Trial App

This project implements the [SMART on FHIR](https://smarthealthit.org/) standard, providing both a backend and a frontend for understanding the smart on fhir raw authentication flow 

- **Backend**: Node.js/Express implementation of the SMART on FHIR OAuth2 flow.
- **Frontend**: React app

## Full disclosure
I have implemented the protocol based on my uderstanding, and used AI for some of the logic, while learning REACT (I come from Vue) so take anything in this repo with a grain or two of salt.
There are several missing pieces for authentication to be in a high standard (Supporting secrets, PKCE, state should be in local storage)

## Project Structure

- `backend/` — Node.js backend for SMART on FHIR token exchange and config
- `frontend/` — React frontend (original implementation)
- `backend-smart/` — React frontend using the official SMART on FHIR JavaScript client (`fhirclient`)

---

## How to Run

### 1. Backend

```
cd backend
npm install
npm run dev   # or: npm start
```

- The backend will start on `http://localhost:3001` by default.

### 2. Frontend (React + fhirclient)

```
cd backend-smart
npm install
npm run dev
```

- The frontend will start on `http://localhost:3000` by default.


## Testing with the SMART Sandbox

You can test this app using the [SMART Health IT Sandbox](https://launch.smarthealthit.org/):

1. Go to [https://launch.smarthealthit.org/](https://launch.smarthealthit.org/)
2. Register your app or use the provided launch parameters.
3. Use the launch URL with `?iss=...&launch=...` to start the SMART on FHIR flow.
4. The frontend will use the official SMART on FHIR JavaScript library ([fhirclient](https://github.com/smart-on-fhir/client-js)) to handle authentication and FHIR API access in the browser.



---

## References
- [SMART on FHIR Specification](https://hl7.org/fhir/smart-app-launch/)
- [SMART Health IT Sandbox](https://launch.smarthealthit.org/)
- [fhirclient JavaScript Library](https://github.com/smart-on-fhir/client-js)
