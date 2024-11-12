import { Database } from "./backend";

export class Authors 
{
    static async showAll() 
    {
        const store = await Database.getObjectStore("authors");

        return new Promise((resolve, reject) => 
        {
            const request = store.getAll(); // Get all authors from the object store
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    static async searchByLabel(label: string) 
    {
        const store = await Database.getObjectStore("authors");

        return new Promise((resolve, reject) =>
        {
            const labelIndex = store.index("label"); // Assuming there's an index on 'label'
            const request = labelIndex.getAll(label);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Search authors by book ID (retrieve all authors for the given book).
    static async searchByBook(id_book: number) 
    {
        const db = await Database.getDatabase();
        const bookAuthorsStore = db.transaction("book_authors", "readonly").objectStore("book_authors");

        return new Promise((resolve, reject) => 
        {
            const bookAuthorsIndex = bookAuthorsStore.index("id_book");
            const request = bookAuthorsIndex.getAll(id_book);

            request.onsuccess = async () => 
            {
                const baRelationships = request.result;
                const authorsIds = baRelationships.map(ba => ba.id_author);

                const authorPromises = authorsIds.map((authorId) => 
                {
                    const authorStore = db.transaction("authors", "readonly").objectStore("authors");
                    return new Promise((authorResolve, authorReject) => 
                    {
                        const authorRequest = authorStore.get(authorId);
                        authorRequest.onsuccess = () => authorResolve(authorRequest.result);
                        authorRequest.onerror = () => authorReject(authorRequest.error);
                    });
                });

                resolve(await Promise.all(authorPromises));
            };

            request.onerror = () => reject(request.error);
        });
    }

    static async create(label: string) 
    {
        const store = await Database.getObjectStore("authors", "readwrite");

        return new Promise((resolve, reject) => 
        {
            const request = store.add({ label });
            request.onsuccess = () => resolve(request.result); 
            request.onerror = () => reject(request.error);
        });
    }

    static async edit(id: number, label: string) 
    {
        const store = await Database.getObjectStore("authors", "readwrite");

        return new Promise((resolve, reject) => 
        {
            const getRequest = store.get(id);

            getRequest.onsuccess = () => 
            {
                const author = getRequest.result;
                if (!author) return reject("Author not found");

                author.label = label;

                const putRequest = store.put(author);
                putRequest.onsuccess = () => resolve(putRequest.result);
                putRequest.onerror = () => reject(putRequest.error);
            };

            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    static async delete(id: number) 
    {
        const store = await Database.getObjectStore("authors", "readwrite");

        return new Promise((resolve, reject) => 
        {
            const request = store.delete(id);
            request.onsuccess = () => resolve(undefined); 
            request.onerror = () => reject(request.error);
        });
    }
}
