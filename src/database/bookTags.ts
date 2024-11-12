import { Database } from "./backend";

export class BookTags 
{
    // Create a new book-tag relationship
    static async create(book_id: number, tag_id: number) 
    {
        const store = await Database.getObjectStore("book_tags", "readwrite");

        return new Promise((resolve, reject) =>
        {
            const request = store.add({ id_book: book_id, id_tag: tag_id });
            request.onsuccess = () => resolve(request.result); // Resolve with the result of the add operation
            request.onerror = () => reject(request.error);
        });
    }

    // Delete all tag associations for a given book
    static async deleteByBook(id_book: number) 
    {
        const store = await Database.getObjectStore("book_tags", "readwrite");

        return new Promise((resolve, reject) => 
        {
            const request = store.index("id_book").getAll(); 

            request.onsuccess = (event) => 
                {
                    const btRelationships = (event.target as IDBRequest).result;
                    const deletePromises = btRelationships
                        .filter((bookTag: any) => bookTag.id_book === id_book)
                        .map((bookTag: any) => 
                            new Promise<void>((delResolve, delReject) => 
                            {
                                const deleteRequest = store.delete(bookTag.id);
                                deleteRequest.onsuccess = () => delResolve();
                                deleteRequest.onerror = () => delReject(deleteRequest.error);
                            })
                        );
    
                    Promise.all(deletePromises).then(() => resolve(undefined)).catch(reject);
                };

            request.onerror = () => reject(request.error);
        });
    }

    // Delete all book associations for a given tag
    static async deleteByTag(tag_id: number) 
    {
        const store = await Database.getObjectStore("book_tags", "readwrite");

        return new Promise((resolve, reject) => 
        {
            const index = store.index("id_tag"); // Index for id_tag
            const request = index.openCursor(IDBKeyRange.only(tag_id)); // Get all entries for this tag
            const deleteRequests: Promise<any>[] = [];

            request.onsuccess = (event) => 
            {
                const cursor = (event.target as IDBRequest).result;
                if (cursor) 
                {
                    const deleteRequest = store.delete(cursor.primaryKey); // Delete the book-tag relationship

                    deleteRequests.push(new Promise((delResolve, delReject) => 
                    {
                        deleteRequest.onsuccess = () => delResolve(undefined);
                        deleteRequest.onerror = () => delReject(deleteRequest.error);
                    }));
                    
                    cursor.continue();
                } 
                else 
                {
                    // Once all the delete operations are queued, resolve the promise
                    Promise.all(deleteRequests)
                        .then(() => resolve(undefined))
                        .catch(err => reject(err));
                }
            };

            request.onerror = () => reject(request.error);
        });
    }
}
