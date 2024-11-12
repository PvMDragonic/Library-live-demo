import { Database } from "./backend";

export class BookAuthors 
{
    // Create a new book-author relationship.
    static async create(id_book: number, id_author: number) 
    {
        const store = await Database.getObjectStore("book_authors", "readwrite");

        return new Promise((resolve, reject) => 
        {
            const request = store.add({ id_book, id_author });
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Delete all author associations for a given book.
    static async deleteByBook(id_book: number) 
    {
        const store = await Database.getObjectStore("book_authors", "readwrite");

        return new Promise((resolve, reject) => 
        {
            const request = store.index("id_book").getAll(); 

            request.onsuccess = (event) => 
            {
                const baRelationships = (event.target as IDBRequest).result;
                const deletePromises = baRelationships
                    .filter((bookAuthor: any) => bookAuthor.id_book === id_book)
                    .map((bookAuthor: any) => 
                        new Promise<void>((delResolve, delReject) => 
                        {
                            const deleteRequest = store.delete(bookAuthor.id);
                            deleteRequest.onsuccess = () => delResolve();
                            deleteRequest.onerror = () => delReject(deleteRequest.error);
                        })
                    );

                Promise.all(deletePromises).then(() => resolve(undefined)).catch(reject);
            };

            request.onerror = () => reject(request.error);
        });
    }
}