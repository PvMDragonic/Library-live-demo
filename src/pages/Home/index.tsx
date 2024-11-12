import { useState, useEffect, useRef, useContext, useMemo } from "react";
import { ColorModeContext } from "../../components/ColorScheme";
import { useMobileLayout } from "../../hooks/useMobileLayout";
import { TitleContainer } from "../../components/TitleContainer";
import { BookCard, ITag } from "../../components/BookCard";
import { useScrolled } from "../../hooks/useScrolled";
import { OptionsBar } from "../../components/OptionsBar";
import { NavOptions } from "../../components/NavOptions";
import { SideMenu } from "../../components/SideMenu";
import { NavBar } from "../../components/NavBar";
import { IBook } from "../../components/BookCard";

import { Books } from "../../database/books";
import { Tags } from "../../database/tags";

export interface SearchType
{
    type: string;
    value: string;
    firstLoad?: boolean;
    toggleCase?: boolean;
    wholeWord?: boolean;
    enterPress?: boolean;
}

const emptySearch = 
{ 
    type: '', 
    value: ''
};

export function Home() 
{
    const [tags, setTags] = useState<ITag[]>([]);
    const [books, setBooks] = useState<IBook[]>([]);
    const [searchOption, setSearchOption] = useState<SearchType>(emptySearch);
    const [displayOptions, setDisplayOptions] = useState<IBook[]>([]);
    const [showSideMenu, setShowSideMenu] = useState<boolean>(false);

    const mainBodyRef = useRef<HTMLDivElement>(null);
    const booksListRef = useRef<HTMLDivElement>(null);
    const booksWrapperRef = useRef<HTMLDivElement>(null);

    const { scrolledBottom } = useScrolled({ element: booksWrapperRef });
    const { mobileLayout } = useMobileLayout({ widthMark: 800 });
    const { colorMode } = useContext(ColorModeContext);
    
    const cachedOptionsBar = useMemo(() => 
    {
        return (
            <OptionsBar
                books = {books}
                tags = {tags}
                searchOption = {searchOption}
                mobileLayout = {mobileLayout}
                setShowSideMenu = {setShowSideMenu}
                setSearchOption = {setSearchOption}
                setDisplayOptions = {setDisplayOptions}
            />
        )
    }, [books, tags, mobileLayout, searchOption]);

    useEffect(() => 
    {
        async function fetchData()
        {
            const allBooks = await (Books.showAll()) as IBook[];
            setDisplayOptions(allBooks);
            setBooks(allBooks);

            const allTags = await (Tags.showAll()) as ITag[];
            setTags(allTags);
        }

        fetchData();
    }, []);

    const booksWrapperClassName = `main-home__books-wrapper main-home__books-wrapper--${colorMode}`;

    return (
        <>
            <NavBar
                mobile = {mobileLayout}
                mainBodyRef = {mainBodyRef}
                sideMenuContent = {cachedOptionsBar}
                sideMenuStateProps = {[showSideMenu, setShowSideMenu]}
            />
            <div 
                ref = {mainBodyRef}
                className = {`main-home main-home--${colorMode}`}
            >
                {!mobileLayout && (cachedOptionsBar)}
                <div className = "main-home__container" ref = {booksListRef}>
                    <TitleContainer
                        totalBooks = {displayOptions.length}
                        searchOption = {searchOption}
                    />
                    <div 
                        ref = {booksWrapperRef}
                        className = {booksWrapperClassName}
                        // Monkey brain solution to prevent CSS polution.
                        style = {{ '--scrolled-bottom': `${!scrolledBottom}` } as React.CSSProperties}
                    >      
                        <section className = "main-home__books-list">
                            {displayOptions.map((book) => {
                                return (
                                    <BookCard
                                        key = {book.id}
                                        id = {book.id}
                                        title = {book.title}
                                        authors = {book.authors}
                                        tags = {book.tags}
                                        publisher = {book.publisher}
                                        release = {book.release}  
                                        cover = {book.cover} 
                                        type = {book.type}                     
                                    />
                                );
                            })}
                        </section>
                    </div>
                </div>
            </div>
        </>
    );
}