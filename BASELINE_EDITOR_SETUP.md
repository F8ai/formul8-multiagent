# Baseline Question Editor Setup Guide

## Overview

The baseline test dashboard (`docs/baseline.html`) now supports inline editing of questions and expected answers. When edits are made, GitHub issues are automatically created for the respective agents to track and implement the changes.

**Note:** This implementation is designed for GitHub Pages deployment and uses client-side GitHub API calls.

## Features

- ✏️ **Inline Editing**: Click on any question or expected answer to edit it
- 💾 **Save/Cancel**: Save changes or cancel editing
- 🎫 **GitHub Issues**: Automatically creates GitHub issues for agent edits
- ✅ **Validation**: Prevents saving empty values
- 🔔 **Notifications**: Shows success/error notifications
- 🔑 **Token Management**: Secure token input with session storage

## Setup Requirements

### 1. GitHub Token Configuration

To enable GitHub issue creation, you need to set up a GitHub Personal Access Token:

#### Create GitHub Token:
1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name like "Formul8 Baseline Editor"
4. Select scopes:
   - `repo` (Full control of private repositories)
   - `issues` (Create and edit issues)
5. Copy the generated token

#### Using the Token:
- The token is entered through a secure modal when you first try to edit
- Token is stored in browser sessionStorage (cleared when browser closes)
- No server-side storage or environment variables needed

### 2. GitHub Pages Deployment

This implementation works with GitHub Pages static hosting:

1. **No server required**: All functionality runs client-side
2. **Direct GitHub API**: Uses GitHub REST API directly from browser
3. **Session storage**: Token stored locally in browser session
4. **CORS friendly**: Works with GitHub's CORS policies

## How It Works

### 1. Editing Process
1. User clicks on a question or expected answer in the baseline dashboard
2. If no GitHub token is stored, a modal appears to enter the token
3. Inline editor appears with the current value
4. User makes changes and clicks "Save"
5. System validates the input (prevents empty values)
6. GitHub issue is created automatically using the stored token
7. User sees success notification with issue link

### 2. Token Management
- **First use**: Modal appears to enter GitHub token
- **Session storage**: Token stored securely in browser sessionStorage
- **Auto-clear**: Token cleared when browser session ends
- **Re-enter**: If token expires, user can re-enter it

### 3. GitHub Issue Format

Issues are created with:
- **Title**: `📝 Edit [field] for question: [question preview]...`
- **Labels**: `baseline-edit`, `agent-[agent-name]`, `automated`
- **Body**: Detailed information including:
  - Question ID and agent
  - Current and proposed values
  - Full question text
  - Action items for implementation

### 4. Issue Content Example

```markdown
## 📝 Baseline Question Edit Request

**Question ID:** compliance-q001
**Agent:** compliance
**Field:** expectedAnswer
**Category:** sop-generation-compliance-documentation

### Current Value:
```
[Current expected answer text]
```

### Proposed New Value:
```
[New expected answer text]
```

### Question:
Can you make me a compliant SOP for Cannabis Transport in New Jersey?

### Context:
This edit was requested through the baseline test dashboard. Please review and update the corresponding agent's baseline.json file.

### Action Required:
1. Update the `expectedAnswer` field in the agent's baseline.json file
2. Re-run baseline tests to verify the change
3. Close this issue once the change is implemented

---
*This issue was automatically created from the baseline test dashboard.*
```

## API Implementation

The system uses GitHub's REST API directly from the client:

**Endpoint:** `POST https://api.github.com/repos/F8ai/formul8-multiagent/issues`

**Headers:**
```javascript
{
  'Authorization': 'token YOUR_GITHUB_TOKEN',
  'Content-Type': 'application/json',
  'Accept': 'application/vnd.github.v3+json'
}
```

**Request Body:**
```json
{
  "title": "Issue title",
  "body": "Issue description",
  "labels": ["label1", "label2"]
}
```

## Error Handling

The system handles various error scenarios:

- **Missing GitHub Token**: Shows token input modal
- **Authentication Failed**: Invalid or expired token
- **Rate Limit Exceeded**: GitHub API rate limits
- **Invalid Data**: Malformed issue data
- **Network Errors**: Connection issues

## Security Considerations

- **Client-side only**: No server-side token storage
- **Session storage**: Token only stored in browser session
- **Auto-clear**: Token cleared when browser closes
- **Minimal permissions**: Token only needs `repo` and `issues` scopes
- **Direct API**: No intermediate server to compromise

## Troubleshooting

### Common Issues:

1. **"GitHub token is required to create issues"**
   - Enter your GitHub Personal Access Token in the modal
   - Ensure token has `repo` and `issues` scopes

2. **"Failed to create GitHub issue: Bad credentials"**
   - Token may be expired or invalid
   - Generate a new token and re-enter it

3. **"Failed to create GitHub issue: Not Found"**
   - Repository may not exist or be private
   - Check repository permissions

4. **"Failed to create GitHub issue: Resource not accessible by integration"**
   - Token may not have sufficient permissions
   - Ensure token has `repo` and `issues` scopes

### Testing the Setup:

1. Open `docs/baseline.html` in your browser
2. Try editing a question or expected answer
3. Enter your GitHub token when prompted
4. Check that GitHub issue is created successfully

## GitHub Pages Deployment

### Deployment Steps:

1. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Select source: "Deploy from a branch"
   - Choose branch: `main` (or your default branch)
   - Select folder: `/docs`

2. **Access the Dashboard**:
   - Your dashboard will be available at: `https://[username].github.io/formul8-multiagent/docs/baseline.html`
   - Or: `https://[username].github.io/formul8-multiagent/` (if index.html is in docs)

3. **No Additional Setup Required**:
   - No server configuration needed
   - No environment variables to set
   - Works immediately after GitHub Pages deployment

## Future Enhancements

- [ ] Token validation before saving
- [ ] Bulk edit functionality
- [ ] Edit history tracking
- [ ] Integration with agent deployment pipelines
- [ ] Email notifications for issue creation
- [ ] Token expiration detection and renewal