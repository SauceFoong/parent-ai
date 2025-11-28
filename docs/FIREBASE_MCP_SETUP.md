# Firebase MCP Integration Guide

## What is Firebase MCP?

Firebase MCP is a Model Context Protocol server that allows AI assistants (like Claude in Cursor) to directly interact with Firebase services including:
- **Firestore** - Database operations
- **Storage** - File upload/download
- **Authentication** - User management

## Setup Instructions

### 1. Create Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project (or create a new one)
3. Go to **Project Settings** > **Service Accounts**
4. Click **Generate New Private Key**
5. Save the JSON file securely (e.g., `~/.firebase/parent-ai-serviceAccountKey.json`)

### 2. Configure MCP in Cursor

The Firebase MCP is already installed globally. Now configure it in Cursor:

**Edit:** `[project root]/.cursor/mcp.json`

```json
{
  "firebase-mcp": {
    "command": "firebase-mcp",
    "args": [],
    "env": {
      "SERVICE_ACCOUNT_KEY_PATH": "/Users/sheeyaofoong/.firebase/parent-ai-serviceAccountKey.json",
      "FIREBASE_STORAGE_BUCKET": "your-project-id.appspot.com",
      "DEBUG_LOG_FILE": "true"
    }
  }
}
```

### 3. Update Environment Variables

Make sure your `.env` file doesn't conflict. The Firebase MCP will handle Firebase operations independently.

### 4. Available Tools

Once configured, you'll have access to these tools in Cursor:

#### Firestore Operations
- `firestore_add_document` - Add documents
- `firestore_list_documents` - List documents
- `firestore_get_document` - Get specific document
- `firestore_update_document` - Update document
- `firestore_delete_document` - Delete document
- `firestore_list_collections` - List collections
- `firestore_query_collection_group` - Query across subcollections

#### Storage Operations
- `storage_list_files` - List files
- `storage_get_file_info` - Get file metadata
- `storage_upload` - Upload file
- `storage_upload_from_url` - Upload from URL

#### Authentication Operations
- `auth_get_user` - Get user by ID or email

## Integration with Parent AI

### Benefits for Your Project

1. **Database Management**: Easily manage MongoDB → Firestore migration
2. **File Storage**: Upload screenshots and activity data to Firebase Storage
3. **User Management**: Sync Firebase Authentication with your JWT system
4. **Real-time Updates**: Leverage Firebase's real-time capabilities

### Example Usage in Cursor

Once configured, you can ask the AI assistant:

- "Add a test user to Firestore"
- "Upload this screenshot to Firebase Storage"
- "List all activities in the activities collection"
- "Get user data for user ID xyz123"

### Migration Path (Optional)

If you want to migrate from MongoDB to Firebase:

1. **Keep Current MongoDB**: Continue using MongoDB for now
2. **Dual Write**: Write to both MongoDB and Firestore during transition
3. **Verify Data**: Ensure Firestore data matches MongoDB
4. **Switch Over**: Update API to read from Firestore
5. **Remove MongoDB**: Clean up MongoDB dependencies

## Troubleshooting

### Common Issues

**"Firebase is not initialized"**
- Check that `SERVICE_ACCOUNT_KEY_PATH` is absolute path
- Verify the service account has proper permissions

**"Storage bucket not found"**
- Go to Firebase Console → Storage
- Copy exact bucket name (usually `project-id.appspot.com`)
- Update `FIREBASE_STORAGE_BUCKET` in config

**View Logs**
```bash
# Logs are saved to ~/.firebase-mcp/debug.log
tail -f ~/.firebase-mcp/debug.log
```

## Next Steps

1. Create Firebase project if you haven't
2. Download service account key
3. Create `.cursor/mcp.json` in project root
4. Restart Cursor
5. Test by asking AI to "list Firebase collections"

## Resources

- [Firebase MCP GitHub](https://github.com/gannonh/firebase-mcp)
- [Firebase Console](https://console.firebase.google.com)
- [MCP Documentation](https://modelcontextprotocol.io)


