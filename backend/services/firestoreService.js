const { getFirestore } = require('../config/firebaseAdmin');
const logger = require('../utils/logger');

class FirestoreService {
  constructor() {
    this.db = null;
  }

  /**
   * Initialize Firestore connection
   */
  initialize() {
    if (!this.db) {
      this.db = getFirestore();
    }
    return this.db;
  }

  /**
   * Create a new document
   */
  async createDocument(collection, data) {
    try {
      const db = this.initialize();
      const docRef = await db.collection(collection).add({
        ...data,
        createdAt: new Date().toISOString(),
      });
      
      logger.info(`Document created in ${collection}: ${docRef.id}`);
      return { id: docRef.id, ...data };
    } catch (error) {
      logger.error(`Error creating document in ${collection}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get a document by ID
   */
  async getDocument(collection, docId) {
    try {
      const db = this.initialize();
      const docRef = await db.collection(collection).doc(docId).get();
      
      if (!docRef.exists) {
        return null;
      }
      
      return { id: docRef.id, ...docRef.data() };
    } catch (error) {
      logger.error(`Error getting document from ${collection}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update a document
   */
  async updateDocument(collection, docId, data) {
    try {
      const db = this.initialize();
      await db.collection(collection).doc(docId).update({
        ...data,
        updatedAt: new Date().toISOString(),
      });
      
      logger.info(`Document updated in ${collection}: ${docId}`);
      return { id: docId, ...data };
    } catch (error) {
      logger.error(`Error updating document in ${collection}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(collection, docId) {
    try {
      const db = this.initialize();
      await db.collection(collection).doc(docId).delete();
      
      logger.info(`Document deleted from ${collection}: ${docId}`);
      return true;
    } catch (error) {
      logger.error(`Error deleting document from ${collection}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Query documents with filters
   */
  async queryDocuments(collection, filters = {}, options = {}) {
    try {
      const db = this.initialize();
      let query = db.collection(collection);

      // Apply filters
      if (filters.where) {
        filters.where.forEach(([field, operator, value]) => {
          query = query.where(field, operator, value);
        });
      }

      // Apply ordering
      if (filters.orderBy) {
        const [field, direction = 'asc'] = filters.orderBy;
        query = query.orderBy(field, direction);
      }

      // Apply limit
      if (options.limit) {
        query = query.limit(options.limit);
      }

      // Apply offset
      if (options.offset) {
        query = query.offset(options.offset);
      }

      const snapshot = await query.get();
      
      const documents = [];
      snapshot.forEach(doc => {
        documents.push({ id: doc.id, ...doc.data() });
      });

      return documents;
    } catch (error) {
      logger.error(`Error querying documents from ${collection}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all documents in a collection
   */
  async getAllDocuments(collection, limit = 100) {
    try {
      const db = this.initialize();
      const snapshot = await db.collection(collection).limit(limit).get();
      
      const documents = [];
      snapshot.forEach(doc => {
        documents.push({ id: doc.id, ...doc.data() });
      });

      return documents;
    } catch (error) {
      logger.error(`Error getting all documents from ${collection}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Batch write operations
   */
  async batchWrite(operations) {
    try {
      const db = this.initialize();
      const batch = db.batch();

      operations.forEach(({ type, collection, docId, data }) => {
        const docRef = db.collection(collection).doc(docId);
        
        switch (type) {
          case 'set':
            batch.set(docRef, data);
            break;
          case 'update':
            batch.update(docRef, data);
            break;
          case 'delete':
            batch.delete(docRef);
            break;
        }
      });

      await batch.commit();
      logger.info(`Batch write completed: ${operations.length} operations`);
      return true;
    } catch (error) {
      logger.error(`Error in batch write: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get collection statistics
   */
  async getCollectionStats(collection) {
    try {
      const db = this.initialize();
      const snapshot = await db.collection(collection).count().get();
      
      return {
        collection,
        count: snapshot.data().count,
      };
    } catch (error) {
      logger.error(`Error getting stats for ${collection}: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new FirestoreService();


