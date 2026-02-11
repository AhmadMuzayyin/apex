import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    WhereFilterOp,
    Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface QueryFilter {
    field: string;
    operator: WhereFilterOp;
    value: any;
}

export interface QueryOptions {
    filters?: QueryFilter[];
    orderByField?: string;
    orderDirection?: 'asc' | 'desc';
    limitCount?: number;
}

class FirestoreService {
    /**
     * Get semua documents dari collection
     */
    async getAll<T>(collectionName: string, options?: QueryOptions): Promise<T[]> {
        try {
            const collectionRef = collection(db, collectionName);
            let q = query(collectionRef);

            // Apply filters
            if (options?.filters) {
                options.filters.forEach((filter) => {
                    q = query(q, where(filter.field, filter.operator, filter.value));
                });
            }

            // Apply ordering
            if (options?.orderByField) {
                q = query(q, orderBy(options.orderByField, options.orderDirection || 'asc'));
            }

            // Apply limit
            if (options?.limitCount) {
                q = query(q, limit(options.limitCount));
            }

            const snapshot = await getDocs(q);
            return snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as T[];
        } catch (error) {
            console.error(`Error getting ${collectionName}:`, error);
            throw error;
        }
    }

    /**
     * Get single document by ID
     */
    async getById<T>(collectionName: string, id: string): Promise<T | null> {
        try {
            const docRef = doc(db, collectionName, id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return {
                    id: docSnap.id,
                    ...docSnap.data(),
                } as T;
            }
            return null;
        } catch (error) {
            console.error(`Error getting document from ${collectionName}:`, error);
            throw error;
        }
    }

    /**
     * Create new document
     */
    async create<T>(collectionName: string, data: Omit<T, 'id'>): Promise<string> {
        try {
            const collectionRef = collection(db, collectionName);
            const docData = {
                ...data,
                created_at: Timestamp.now(),
            };
            const docRef = await addDoc(collectionRef, docData);
            return docRef.id;
        } catch (error) {
            console.error(`Error creating document in ${collectionName}:`, error);
            throw error;
        }
    }

    /**
     * Update document
     */
    async update<T>(
        collectionName: string,
        id: string,
        data: Partial<Omit<T, 'id'>>
    ): Promise<void> {
        try {
            const docRef = doc(db, collectionName, id);
            const updateData = {
                ...data,
                updated_at: Timestamp.now(),
            };
            await updateDoc(docRef, updateData);
        } catch (error) {
            console.error(`Error updating document in ${collectionName}:`, error);
            throw error;
        }
    }

    /**
     * Delete document
     */
    async delete(collectionName: string, id: string): Promise<void> {
        try {
            const docRef = doc(db, collectionName, id);
            await deleteDoc(docRef);
        } catch (error) {
            console.error(`Error deleting document from ${collectionName}:`, error);
            throw error;
        }
    }

    /**
     * Query dengan kondisi custom
     */
    async queryDocs<T>(
        collectionName: string,
        queryFilters: QueryFilter[]
    ): Promise<T[]> {
        return this.getAll<T>(collectionName, { filters: queryFilters });
    }
}

export const firestoreService = new FirestoreService();
