# User Manual
# LifeSync AI Application

## 1. Getting Started

### 1.1 Accessing the Application
- Open browser and go to: `http://localhost:5173`
- You will see the login page

### 1.2 Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| User | user@demo.com | user123 |
| Admin | admin@lifesyncai.com | admin123 |

## 2. Registration

1. Click "Register" link on login page
2. Fill in the form:
   - **Name**: Your display name
   - **Email**: Valid email address
   - **Password**: Minimum 6 characters
   - **Confirm Password**: Re-enter password
3. Click "Register" button
4. You will be redirected to login page

## 3. Login

1. Enter your email and password
2. Click "Login" button
3. You will be redirected to Dashboard

## 4. Dashboard

The dashboard shows:
- **Tasks Due Today**: Number of tasks due today
- **Overdue Tasks**: Tasks past their due date
- **Completed This Week**: Tasks marked as done this week
- **Focus Time**: Total hours of time blocks this week

### Quick Actions
- Click "View Tasks" to go to tasks page
- Click "Calendar" to view time blocks
- Click "Reminders" to manage reminders

## 5. Task Management

### 5.1 Viewing Tasks
- Navigate to Tasks page from the menu
- Tasks are displayed as cards
- Each card shows:
  - Title
  - Status badge (Todo, In Progress, Done)
  - Priority badge (Low, Medium, High)
  - Due date
  - Tags

### 5.2 Creating a Task
1. Click "+ New Task" button
2. Fill in the form:
   - **Title** (required)
   - **Description** (optional)
   - **Status**: Todo, In Progress, Done
   - **Priority**: Low, Medium, High
   - **Due Date** (optional)
   - **Tags**: Select from available tags
3. Click "Create" button

### 5.3 Editing a Task
1. Click "Edit" button on task card
2. Modify the fields
3. Click "Update" button

### 5.4 Deleting a Task
1. Click "Delete" button on task card
2. Task is removed immediately

### 5.5 Filtering Tasks
Use the filter controls at the top:
- **Search**: Type to search in title/description
- **Status**: Filter by task status
- **Priority**: Filter by priority level

## 6. Calendar & Time Blocks

### 6.1 Viewing Calendar
- Navigate to Calendar page
- View shows current week
- Use "Previous" and "Next" buttons to navigate weeks

### 6.2 Creating a Time Block
1. Click "+ Add Block" button
2. Fill in the form:
   - **Title** (required)
   - **Description** (optional)
   - **Date** (required)
   - **Start Time** (required)
   - **End Time** (required)
3. Click "Create" button

**Note**: Time blocks cannot overlap. If you try to create an overlapping block, you will see an error message.

### 6.3 Deleting a Time Block
- Click the "×" button on the time block

## 7. Reminders

### 7.1 Viewing Reminders
- Navigate to Reminders page
- See list of all reminders
- Triggered reminders are shown with "(triggered)" label

### 7.2 Creating a Reminder
1. Click "+ New Reminder" button
2. Fill in the form:
   - **Message** (required)
   - **Date** (required)
   - **Time** (required)
3. Click "Create" button

### 7.3 Deleting a Reminder
- Click "Delete" button on the reminder

## 8. Notifications

### 8.1 Notification Badge
- The notification badge in the header shows unread count
- Click "Notifications" to view all

### 8.2 Viewing Notifications
- Navigate to Notifications page
- Unread notifications have a blue left border
- Notifications are sorted newest first

### 8.3 Marking as Read
- Click "Mark as read" button on unread notification

## 9. Logout

1. Click "Logout" button in the header
2. You will be redirected to login page
3. Your session is ended

## 10. Tips

### Keyboard Shortcuts
- Press `Enter` to submit forms
- Press `Escape` to close modals

### Best Practices
1. **Set due dates** for tasks to track deadlines
2. **Use tags** to categorize tasks (e.g., Work, Personal)
3. **Create time blocks** to plan your day
4. **Set reminders** for important events
5. **Check dashboard** daily for overview

## 11. Troubleshooting

### Cannot Login
- Check email and password are correct
- Clear browser cache and try again
- Check if backend server is running

### Tasks Not Loading
- Check internet connection
- Refresh the page
- Check if backend server is running

### Time Block Overlap Error
- Check existing time blocks for the same day
- Adjust start/end times to avoid overlap

### Notifications Not Appearing
- Reminders trigger every minute
- Wait for the scheduled time
- Refresh the page

## 12. Support

For technical issues:
- Check the console for error messages
- Verify all services are running
- Review the API documentation
