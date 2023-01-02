# exclusions-db

A exclusions database that is web-based using Node, express and
MongoDB/Mongoose. Used for tracking individuals who are excluded from a service.

## Technologies:

- Node.js
- Express.js
- MongoDB/Mongoose
- Pug.js

## Features

- User authentication:
  - Google reCAPTCHA
  - Password-based
- User Authorization:
  - User Roles:
    - Admin
      - Full: Create, Read, Update, Delete users and exclusions
      - Can authorize other users.
    - Supervisor
      - Moderate: Create, Read, Update, Delete active exclusions.
      - Can register and update own password.
      - Can read archived exclusions list.
    - User
      - Minimal: Read access for existing exclusions
      - Can register and update own password.
- Exclusions:
  - Authorized users may create exclusion orders via form data sent to mongoDB.
  - Authorized users may edit any active exclusion order.
- Rendering:
  - Exclusions list and exclusion orders are rendered for desktop, mobile, and print.
- Images are rendered remotely through Google Photos links.
  - Convert: https://www.labnol.org/embed/google/photos/

# Routes

## GET Routes:

### Routine GET Routes

- / - root, redirects to /login or /home, depending on authentication status
- /login - renders the login page
- /retry_login - A redirect page for unsuccessful login attempts.
- /register - renders the register page, accessible only by Admin for adding new users.
- /unauthorized - basic 'unauthorized' template, contains link to go back to / route.

### Exclusions GET Routes

- /home - renders the exclusions page, displaying all ACTIVE exclusion orders
  - Displays all exclusions, which will be clickable to expand basic data.
    Further clickable to display the whole exclusion order (for print)
  - Button/link for add new exclusion (/add_new_eclusion) (Admin or supervisor only)
  - Link on each card (in exlcusions list) to "edit" (Admin or Supervisor only)
  - Link to archive old/outdated exclusions, or those with a reprieve
  - FEATURE: Sortable based on exclusion length, most recent, or by name
- /add_new_exclusion - renders add new exclusion template (only exclusion page
  outside the /home path)
  - Name - input
  - DOB - input
  - Other info (i.e. gender, height, hair color, etc.) - input
  - Description (what happened, RCW/policy violated) - text area
  - Length of exclusion (3, 7, 14, 30, 60, 180, 365, Lifetime, Other) - dropdown box
    - Other - input
  - Image upload
  - Served Date
  - Expiration Date (optional)
  - Button to save the data
- /home/:exclusion/edit - renders page to edit an exclusion. Accessible by Admin
  or Supervisor users.
- /home/:exclusion/delete - renders delete confirmation page for deleting an
  exclusion order. Accessible by Admin or Supervisor (except for Archived -
  Admin only) user.
- /home/:exclusion/archive - renders page with a text area for explaining why the
  active exclusion is being archived.
- /home/archive - renders list of individuals who have previously been served an
  exclusion order, with the violations.

### Users GET Routes

- /users - Renders a list of all active users. Accessible by admin
- /users/:user - Renders individual user page for selected user.
- /users/:user/edit_user - Renders edit page for individual/selected user. Accessible by individual/logged
  in user to change own account's password/info. Also accessible by admin -
  editing roles, activating account, resetting password, etc...
- /users/:user/delete_user - After confirmation in /users/:user/confirm_delete,
  Redirects to /users route. Accessible by Admin only.
- /users/:user/confirm_delete - Renders page to confirm deletion of selected
  user. Redirects to /users/:user/delete_user route. Accessible by Admin only.

### Archive GET Routes

- /archive - Renders list of all archived exclusions. Accessible by Admin or Supervisor.
- /archive/:exclusion - Renders individual archived/past exclusion order.
  Accessible by Admin or Supervisor.

## POST Routes:

- /login
- /register (accessibly only by admin)
- /edit_user
- /add_exclusion
- /edit_exclusion
- /archive_exclusion

## FUTURE FEATURES:

- Admin authorization: Can lock exclusions
- User logging
- - Add Register Success route

### Created: 11/29/2022; Last edited 1/1/2023
