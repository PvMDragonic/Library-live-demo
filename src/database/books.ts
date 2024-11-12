import { Database } from "./backend";
import { IAuthor, IBook, ITag } from "../components/BookCard";
import { BookAuthors } from "./bookAuthors";
import { BookTags } from "./bookTags";
import { Authors } from "./authors";
import { Tags } from "./tags";

type bookTag = {
    id: number,
    id_book: number,
    id_tag: number
};

type bookAuthor = {
    id: number,
    id_book: number,
    id_author: number
};

export class Books 
{
    private static async saveAuthors(authors: IAuthor[], bookId: number)
    {
        await BookAuthors.deleteByBook(bookId);

        for (const author of authors)
        {
            const authorName = author.label.trim();
            let registeredAuthor = (await Authors.searchByLabel(authorName) as IAuthor[])[0];
    
            if (!registeredAuthor)
            {
                await Authors.create(authorName);
                registeredAuthor = (await Authors.searchByLabel(authorName) as IAuthor[])[0];
            }

            await BookAuthors.create(bookId, registeredAuthor.id);
        } 
    }

    private static async saveTags(tags: ITag[], bookId: number)
    {
        await BookTags.deleteByBook(bookId);

        for (const tag of tags)
        {
            const tagLabel = tag.label;
            let registeredTag = (await Tags.searchByLabel(tagLabel) as ITag[])[0];
    
            if (!registeredTag)
            {
                await Tags.create(tag);
                registeredTag = (await Tags.searchByLabel(tagLabel) as ITag[])[0];
            }

            await BookTags.create(bookId, registeredTag.id);
        }
    }

    private static async fullBookData(books: IBook[])
    {
        const db = await Database.getDatabase();

        const transaction = db.transaction(
            ["book_tags", "tags", "book_authors", "authors"], 
            "readonly"
        );

        const bookTagStore = transaction.objectStore("book_tags");
        const tagStore = transaction.objectStore("tags");
        const bookAuthorStore = transaction.objectStore("book_authors");
        const authorStore = transaction.objectStore("authors");

        const tagKeysRequest = bookTagStore.index("id_book").getAll();
        const bookTags = await new Promise<bookTag[]>((resolve, reject) => 
        {
            tagKeysRequest.onsuccess = (event) => {
                resolve((event.target as IDBRequest).result);
            };

            tagKeysRequest.onerror = (event) => {
                reject((event.target as IDBRequest).error);
            };
        });

        const authorKeysRequest = bookAuthorStore.index("id_book").getAll();
        const bookAuthors = await new Promise<bookAuthor[]>((resolve, reject) => 
        {
            authorKeysRequest.onsuccess = (event) => {
                resolve((event.target as IDBRequest).result);
            };

            authorKeysRequest.onerror = (event) => {
                reject((event.target as IDBRequest).error);
            };
        });

        return await Promise.all(
            books.map(async book => 
            {
                const tags = await Promise.all(
                    bookTags.filter(bt => bt.id_book === book.id).map(bt =>
                    {
                        const tagRequest = tagStore.get(bt.id_tag);

                        return new Promise<ITag>((resolveTag, rejectTag) =>
                        {
                            tagRequest.onsuccess = () => resolveTag(tagRequest.result);
                            tagRequest.onerror = () => rejectTag(tagRequest.error);
                        });
                    })
                );

                const authors = await Promise.all(
                    bookAuthors.filter(ba => ba.id_book === book.id).map(ba =>
                    {
                        const authorRequest = authorStore.get(ba.id_author);
                        return new Promise<IAuthor>((resolveAuthor, rejectAuthor) => 
                        {
                            authorRequest.onsuccess = () => resolveAuthor(authorRequest.result);
                            authorRequest.onerror = () => rejectAuthor(authorRequest.error);
                        });
                    })
                );

                return {
                    ...book,
                    authors,
                    tags
                };
            })
        );
    }

    // Show all books
    static async showAll(): Promise<IBook[]> 
    {
        const db = await Database.getDatabase();
        const transaction = db.transaction(["books"], "readonly");
        const bookStore = transaction.objectStore("books");

        return new Promise((resolve, reject) => 
        {
            const request = bookStore.getAll();

            request.onsuccess = async () => 
            {
                const books = request.result.map(book => ({
                    ...book,
                    type: !book.attachment
                        ? undefined
                        : book.attachment.startsWith("data:application/pdf") ? "pdf" :
                        book.attachment.startsWith("data:application/epub") ? "epub" : ""
                }));

                resolve(await this.fullBookData(books));
            };

            request.onerror = () => reject(request.error);
        });
    }

    // Search books by author name.
    static async searchByAuthor(authorName: string): Promise<IBook[]> 
    {
        const db = await Database.getDatabase();
        const booksStore = db.transaction(["books", "book_authors", "authors"], "readonly");

        return new Promise((resolve, reject) => 
        {
            const authorStore = booksStore.objectStore("authors").index("label");
            const authorRequest = authorStore.get(authorName);
    
            authorRequest.onsuccess = () => 
            {
                const authorRecord = authorRequest.result;
                if (!authorRecord) return resolve([]);
    
                const bookAuthorsStore = booksStore.objectStore("book_authors").index("id_author");
                const bookAuthorRequest = bookAuthorsStore.getAll(authorRecord.id);
    
                bookAuthorRequest.onsuccess = () => 
                {
                    const bookRequests = bookAuthorRequest.result.map(ba => 
                    {
                        return new Promise<IBook>((resolveBook, rejectBook) => 
                        {
                            const bookRequest = booksStore.objectStore("books").get(ba.id_book);
                            bookRequest.onsuccess = () => resolveBook(bookRequest.result);
                            bookRequest.onerror = () => rejectBook(bookRequest.error);
                        });
                    });
    
                    // Wait for all book requests to complete and then resolve with the full array.
                    Promise.all(bookRequests).then(resolve).catch(reject);
                };
    
                bookAuthorRequest.onerror = () => reject(bookAuthorRequest.error);
            };
    
            authorRequest.onerror = () => reject(authorRequest.error);
        });
    }

    // Search books by title
    static async searchByTitle(title: string): Promise<IBook[]> 
    {
        const store = await Database.getObjectStore("books");

        return new Promise((resolve, reject) => 
        {
            const titleIndex = store.index("title");
            const request = titleIndex.getAll(title);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Search books by ID
    static async searchById(id: number) 
    {
        const store = await Database.getObjectStore("books");

        return new Promise((resolve, reject) => 
        {
            const request = store.get(id);

            request.onsuccess = async () => 
            {
                const book = await this.fullBookData([request.result]);
                resolve(book[0]);
            };

            request.onerror = () => reject(request.error);
        });
    }

    // Create a new book
    static async create({ title, publisher, authors, tags, release, cover, attachment }: Omit<IBook, 'progress'>) 
    {
        const store = await Database.getObjectStore("books", "readwrite");

        return new Promise((resolve, reject) => 
        {
            const request = store.add({ title, publisher, release, cover, attachment, progress: 0 });

            request.onsuccess = async () => 
            {
                const id = request.result;
                const bookId = Number(id);
                await Books.saveAuthors(authors, bookId);
                await Books.saveTags(tags, bookId);
                resolve(id);
            };

            request.onerror = () => reject(request.error);
        });
    }

    // Edit a book by ID
    static async edit({ id, title, publisher, authors, tags, release, cover, attachment }: Omit<IBook, 'progress'>) 
    {
        const store = await Database.getObjectStore("books", "readwrite");

        return new Promise((resolve, reject) => 
        {
            const getRequest = store.get(id);

            getRequest.onsuccess = () => 
            {
                const book = getRequest.result;
                if (!book) return reject("Book not found");

                Object.assign(book, { title, publisher, release, cover, attachment });
                const putRequest = store.put(book);

                putRequest.onsuccess = async () => 
                {
                    const id = putRequest.result;
                    const bookId = Number(id);
                    await Books.saveAuthors(authors, bookId);
                    await Books.saveTags(tags, bookId);
                    resolve(id);
                };
                
                putRequest.onerror = () => reject(putRequest.error);
            };
            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    // Update the progress of a book
    static async updateProgress({ id, progress }: Omit<IBook, 'title' | 'authors' | 'tags' | 'publisher' | 'release' | 'cover' | 'attachment' >) 
    {
        const store = await Database.getObjectStore("books", "readwrite");

        return new Promise((resolve, reject) => 
        {
            const getRequest = store.get(id);

            getRequest.onsuccess = () => 
            {
                const book = getRequest.result;
                if (!book) return reject("Book not found");

                book.progress = progress;
                const putRequest = store.put(book);
                putRequest.onsuccess = () => resolve(putRequest.result);
                putRequest.onerror = () => reject(putRequest.error);
            };
            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    static async delete(bookId: number) 
    {
        // Needs to cache before deletion starts.
        const bookAuthors = await Authors.searchByBook(bookId) as IAuthor[];

        // Clear the relations between authors and tags with the book.
        await BookAuthors.deleteByBook(bookId);
        await BookTags.deleteByBook(bookId);

        // Deletes author(s) if no other book has them.
        for (const author of bookAuthors)
        {
            const booksWithAuthor = await this.searchByAuthor(author.label) as IBook[];
            if (!booksWithAuthor.length)
                Authors.delete(author.id);
        }

        const store = await Database.getObjectStore("books", "readwrite");
        return new Promise((resolve, reject) => 
        {
            const request = store.delete(bookId);
            request.onsuccess = async () => resolve(undefined);
            request.onerror = () => reject(request.error);
        });
    }
}
