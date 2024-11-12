import { useRef, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { ColorModeContext } from '../../components/ColorScheme';
import { useScrollable } from '../../hooks/useScrollable';
import { SearchType } from '../../pages/Home';

interface ITitleContainer
{
    totalBooks: number
    searchOption: SearchType | undefined;
}

export function TitleContainer({ totalBooks, searchOption }: ITitleContainer)
{
    const parentDivRef = useRef<HTMLDivElement>(null);
    const titleTextRef = useRef<HTMLHeadingElement>(null);
    
    const { t } = useTranslation();
    const { colorMode } = useContext(ColorModeContext);
    const { shouldScroll } = useScrollable({
        scrollingText: titleTextRef,
        parentDiv: parentDivRef
    });

    const textClass = shouldScroll 
        ? `main-title__header main-title__header--scroll main-title__header--${colorMode}` 
        : `main-title__header main-title__header--${colorMode}`;

    return (
        <div className = {`main-title main-title--${colorMode}`}>
            <div className = "main-title__header-container" ref = {parentDivRef}>
                <h1 className = {textClass} ref = {titleTextRef}>
                    {searchOption && searchOption.type !== '' ? (
                        searchOption.value === '' ? (
                            <span>
                                {searchOption.type}: <i>{t('bookTypeUnknown')}</i>
                            </span>
                        ) : (
                            `${t(`bookType${searchOption.type}`)}: "${searchOption.value}"`
                        )
                    ) : (
                        t('booksHeader')
                    )}
                </h1>
            </div>
            <span className = {`main-title__total-books main-title__total-books--${colorMode}`}>
                {t('booksHeaderTotal')}: {totalBooks}
            </span>
        </div>
        
    );
}