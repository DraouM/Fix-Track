# **App Name**: FixTrack

## Core Features:

- Add New Repair: Form to input repair details: customer name, phone number, device, issue, estimated cost, repair status, date received.
- Repair List Table: Table listing all repairs with columns: Customer Name, Device, Issue, Status, Date Received, Cost. Includes a 'View' button for details.
- Repair Detail View: Modal/panel displaying full repair details, timestamps, and status history. Allows updating the repair status.
- AI Issue Analysis: Use a tool to analyze the issue description to predict parts needed or suggest common fixes. Display suggestions to the user.
- Basic Analytics: Display counts for total, completed, and pending repairs at the top of the page.

## Style Guidelines:

- Light theme with a clean, professional look.
- Color-coded status badges: Green for 'Completed', Orange for 'In Progress', Red for 'Cancelled', Gray for 'Pending'.
- Accent color: Teal (#008080) for interactive elements and highlights.
- Modular design using cards or a form layout for inputs.
- Responsive layout adapting to mobile and desktop screens.
- Simple, clear icons for navigation and actions.

## Original User Request:
Create a single-page web application for a phone repair shop. The app should allow the user to log and manage repair orders for clients. The app should be clean, modern, and mobile-friendly. Use a modular layout and a minimal UI design with sections for adding a repair, listing current repairs, and showing detailed status of each repair.

Features:
Add New Repair

A form with fields:

Customer Name

Phone Number

Device Brand and Model

Issue Description

Estimated Cost

Repair Status (Pending, In Progress, Completed, Cancelled)

Date Received

Submit button to save the repair order

Repair List Table

Displays all repairs in a table format

Columns: Customer Name, Device, Issue, Status, Date Received, Cost

Each row should have a “View” button to open detailed info

Repair Detail Modal or Panel

Shows full info for the selected repair, including timestamps and status history

Allow updating the repair status from this view

Basic Analytics (Optional)

Show a count of total repairs, completed repairs, and pending ones at the top

Simple Styling

Use a light theme

Responsive layout for mobile and desktop

Use color-coded badges or labels for statuses (e.g., green for completed, orange for in progress)

Tech Stack:
Frontend only (can be HTML/CSS/JS or use React/Vue/Next.js depending on the tool's default)

Store data in-memory or with Firebase Firestore for backend (optional for MVP)

Optional: support image upload of the device condition (before/after)

UI Notes:
Navigation bar or title header: "Phone Repair Tracker"

Use cards or a form layout for inputs

Keep it clean and distraction-free, suitable for a small shop using it on a tablet

This is meant to be a simple internal tool for a repair shop. It does not require user login at this stage.
  