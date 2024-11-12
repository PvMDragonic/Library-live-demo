import { useParams } from "react-router-dom";
import { useContext, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ColorModeContext } from "../../components/ColorScheme";
import { DeleteMessage } from "../../components/DeleteMessage";
import { BookForm } from "../../components/BookForm";
import { IBook } from "../../components/BookCard";
import { blankBook } from "../NewBook";
import RevertCoverIcon from "../../assets/RevertCoverIcon";
import DeleteIcon from "../../assets/DeleteIcon";

import { Books } from "../../database/books";
import { Authors } from "../../database/authors";
import { BookAuthors } from "../../database/bookAuthors";

export function EditBook() 
{
    const [book, setBook] = useState<IBook>(blankBook);
    const [ogBook, setOgBook] = useState<IBook>(blankBook);
    const [deleteMsg, setDeleteMsg] = useState(false);

    const { colorMode } = useContext(ColorModeContext);
    const { t, i18n } = useTranslation();
    const { id } = useParams();

    const regularHeader = useMemo(() => (
        <header className = {`book-form__header book-form__header--${colorMode}`}>
            <h1>{t('editBookHeader')}</h1>
            <div>
                {JSON.stringify(ogBook) !== JSON.stringify(book) && (
                    <button 
                        type = "button"
                        title = {t('revertEditsBtnTitle')} 
                        style = {{ '--resetButtonContent': `"‎ ${t('revertEditsBtnText')}"` } as React.CSSProperties } 
                        onClick = {() => setBook(ogBook)}
                        className = "book-form__button book-form__button--reset" 
                    >
                        <RevertCoverIcon/>
                    </button>
                )}
                <button 
                    type = "button"
                    title = {t('deleteBookBtnTitle')}
                    style = {{ '--deleteButtonContent': `"‎ ${t('deleteBookBtnTitle')}"` } as React.CSSProperties } 
                    onClick = {() => setDeleteMsg(true)}
                    className = "book-form__button book-form__button--delete"
                >
                    <DeleteIcon/>
                </button>
            </div>
        </header>
    ), [book, i18n.language, colorMode]);
 
    // <DeleteMessage> gets absolute-positioned over the <form>.
    const deleteHeader = useMemo(() => (
        <>
            <header className = {`book-form__header book-form__header--${colorMode}`}>
                <h1>{t('deleteBookBtnTitle')}</h1>
            </header>

            <DeleteMessage 
                id = {book.id}
                title = {book.title}
                abortDeletion = {setDeleteMsg}
            />
        </>
    ), [book, i18n.language, colorMode]);

    useEffect(() =>
    {
        async function fetchData()
        {
            const bookData = await Books.searchById(Number(id)) as IBook;
            setOgBook(bookData);
            setBook(bookData);
        }

        fetchData();
    }, []);

    async function saveBook()
    {
        await Books.edit(book);

        const authorsNew = book.authors;
        const authorsOld = ogBook.authors;
        const authorsRemoved = authorsOld.filter(
            oldAuthor => !authorsNew.some(
                newAuthor => oldAuthor.label === newAuthor.label
            ) 
        );

        const bookId = Number(id);
        for (const author of authorsRemoved)
        {
            const authorHasBook = await Books.searchByAuthor(author.label) as IBook[];
            if (!authorHasBook.length)
            {
                BookAuthors.deleteByBook(bookId);
                Authors.delete(author.id);
            }
        }
    }

    return (
        <BookForm
            header = {deleteMsg ? deleteHeader : regularHeader}
            delMsg = {deleteMsg}
            book = {book}
            setBook = {setBook}
            saveBook = {saveBook}
        />
    )
}