import { ITag } from "../components/BookCard";
import { Database } from "./backend";
import { BookTags } from "./bookTags";

export class Tags 
{
    // Show all tags
    static async showAll() 
    {
        const store = await Database.getObjectStore("tags");

        return new Promise((resolve, reject) => 
        {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Search tags by label
    static async searchByLabel(label: string) 
    {
        const store = await Database.getObjectStore("tags");

        return new Promise((resolve, reject) => 
        {
            const labelIndex = store.index("label");
            const request = labelIndex.getAll(label);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Search tags by book ID (retrieve all tags for the given book).
    static async searchByBook(book_id: number) 
    {
        const db = await Database.getDatabase();
        const bookTagsStore = db.transaction("book_tags", "readonly").objectStore("book_tags");

        return new Promise((resolve, reject) => 
        {
            const bookTagsIndex = bookTagsStore.index("id_book");
            const request = bookTagsIndex.getAll(book_id);

            request.onsuccess = async () => 
            {
                const btRelationships = request.result;
                const tagsIds = btRelationships.map(bt => bt.id_tag);

                const tagPromises = tagsIds.map((tagId) => 
                {
                    const tagStore = db.transaction("tags", "readonly").objectStore("tags");
                    return new Promise((authorResolve, authorReject) => 
                    {
                        const tagRequest = tagStore.get(tagId);
                        tagRequest.onsuccess = () => authorResolve(tagRequest.result);
                        tagRequest.onerror = () => authorReject(tagRequest.error);
                    });
                });

                resolve(await Promise.all(tagPromises));
            };

            request.onerror = () => reject(request.error);
        });
    }

    // Create a new tag
    static async create({ label, color }: Omit<ITag, 'id'>) 
    {
        const store = await Database.getObjectStore("tags", "readwrite");

        return new Promise((resolve, reject) => 
        {
            const request = store.add({ label, color });
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Edit an existing tag by ID
    static async edit({ id, label, color }: ITag) 
    {
        const store = await Database.getObjectStore("tags", "readwrite");

        return new Promise((resolve, reject) => 
        {
            const getRequest = store.get(id);

            getRequest.onsuccess = () => 
            {
                const tag = getRequest.result;
                if (!tag) return reject("Tag not found");

                tag.label = label;
                tag.color = color;

                const putRequest = store.put(tag);
                putRequest.onsuccess = () => resolve(putRequest.result);
                putRequest.onerror = () => reject(putRequest.error);
            };

            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    // Delete a tag by ID
    static async delete(tagId: number) 
    {
        await BookTags.deleteByTag(tagId); 

        const store = await Database.getObjectStore("tags", "readwrite");

        return new Promise((resolve, reject) => 
        {
            const request = store.delete(tagId);
            request.onsuccess = () => resolve(undefined);
            request.onerror = () => reject(request.error);
        });
    }
}