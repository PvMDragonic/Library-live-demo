import { IAuthor, IBook, ITag } from "../components/BookCard";

/**
 * Class for handling the connection and info retrieval from the browser's IndexedDB.
 */
export class Database
{
    /**
     * Opens a connection to the database.
     */
    static getDatabase(): Promise<IDBDatabase> 
    {
        return new Promise((resolve, reject) => 
        {
            const request = indexedDB.open("LibraryDatabase", 1);
            
            request.onupgradeneeded = async (event) => 
            {
                await this.createDatabase(event);
                await this.insertDefaultData();
            };

            request.onsuccess = () => resolve(request.result);

            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Helper method to open a transaction and get the object store.
     * @param storeName name of what's being searched.
     * @param mode either 'readonly' (default) or 'readwrite'.
     */
    static async getObjectStore(storeName: string, mode: IDBTransactionMode = "readonly"): Promise<IDBObjectStore>
    {
        const db = await this.getDatabase();
        const transaction = db.transaction(storeName, mode);
        return transaction.objectStore(storeName);
    }

    private static async createDatabase(event: IDBVersionChangeEvent)
    {
        const db = (event.target as IDBOpenDBRequest).result;

        // Books Store
        const booksStore = db.createObjectStore("books", { keyPath: "id", autoIncrement: true });
        booksStore.createIndex("title", "title", { unique: false });
        booksStore.createIndex("publisher", "publisher", { unique: false });
        booksStore.createIndex("release", "release", { unique: false });
        booksStore.createIndex("cover", "cover", { unique: false });
        booksStore.createIndex("attachment", "attachment", { unique: false });

        // Tags Store
        const tagsStore = db.createObjectStore("tags", { keyPath: "id", autoIncrement: true });
        tagsStore.createIndex("label", "label", { unique: true });
        tagsStore.createIndex("color", "color", { unique: false });

        // BookTags Store (linking books and tags)
        const bookTagsStore = db.createObjectStore("book_tags", { keyPath: "id", autoIncrement: true });
        bookTagsStore.createIndex("id_book", "id_book", { unique: false });
        bookTagsStore.createIndex("id_tag", "id_tag", { unique: false });

        // Authors Store
        const authorsStore = db.createObjectStore("authors", { keyPath: "id", autoIncrement: true });
        authorsStore.createIndex("label", "label", { unique: true });

        // BookAuthors Store (linking books and authors)
        const bookAuthorsStore = db.createObjectStore("book_authors", { keyPath: "id", autoIncrement: true });
        bookAuthorsStore.createIndex("id_book", "id_book", { unique: false });
        bookAuthorsStore.createIndex("id_author", "id_author", { unique: false });

        const defaultStore = db.createObjectStore("defaultData", { keyPath: "id", autoIncrement: true });
        defaultStore.createIndex("exists", "exists", { unique: true });
    }

    private static async insertDefaultData()
    {
        const response = await fetch("./database/default_data.json");
        const { books, authors, tags, bookAuthors, bookTags } = await response.json();

        const db = await this.getDatabase();
        const transaction = db.transaction(
            ["books", "authors", "tags", "book_tags", "book_authors", "defaultData"], 
            "readwrite"
        );

        // Add the book.
        const booksStore = transaction.objectStore("books");
        await Promise.all(books.map((book: IBook) => new Promise((resolve, reject) => 
        {
            const request = booksStore.add({
                title: book.title,
                publisher: book.publisher,
                release: book.release,
                cover: book.cover,
                attachment: book.attachment
            });

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        })));

        // Add the author.
        const authorsStore = transaction.objectStore("authors");
        await Promise.all(authors.map((author: IAuthor) => new Promise((resolve, reject) =>
        {
            const request = authorsStore.add({ 
                label: author.label 
            });

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        })));

        // Link the author(s) to the book.
        const bookAuthorsStore = transaction.objectStore("book_authors");
        await new Promise((resolve, reject) => 
        {
            let completed = 0;
        
            bookAuthors.forEach((entry: [number, number]) => 
            {
                const request = bookAuthorsStore.add({
                    id_book: entry[0],
                    id_author: entry[1]
                });
                
                request.onsuccess = () =>
                {
                    completed += 1;
                    if (completed === bookAuthors.length) 
                        resolve(undefined);
                };
        
                request.onerror = (event) => reject(event);
            });
        });

        // Add the tags and link relevant tags to the book.
        const tagsStore = transaction.objectStore("tags");
        await Promise.all(tags.map((tag: ITag) => new Promise((resolve, reject) => 
        {
            const request = tagsStore.add({ 
                label: tag.label, 
                color: tag.color 
            });

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        })));

        // Link specified tags to the book.
        const bookTagsStore = transaction.objectStore("book_tags");
        await new Promise((resolve, reject) => 
        {
            let completed = 0;
        
            bookTags.forEach((entry: [number, number]) => 
            {
                const request = bookTagsStore.add({
                    id_book: entry[0],
                    id_tag: entry[1]
                });
                
                request.onsuccess = () =>
                {
                    completed += 1;
                    if (completed === bookTags.length) 
                        resolve(undefined);
                };
        
                request.onerror = (event) => reject(event);
            });
        });

        const defaultExistsStore = transaction.objectStore("defaultData");
        await new Promise((resolve, reject) => 
        {
            const request = defaultExistsStore.add({
                exists: 'true'
            });

            request.onsuccess = resolve;
            request.onerror = reject;
        });

        transaction.onerror = (error) => console.error("Error loading mock data:", error);
    }
}