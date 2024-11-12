import { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useMobileLayout } from "../../hooks/useMobileLayout";
import { NavOptions } from "../../components/NavOptions";
import { SideMenu } from "../../components/SideMenu";
import { blankBook } from "../../pages/NewBook";
import { NavBar } from "../../components/NavBar";
import { IBook } from "../../components/BookCard";
import { EpubReader } from "./epub";
import { PdfReader } from "./pdf";
import React from "react";

import { Books } from "../../database/books";

export interface IReader
{
    updateProgress: (progress: string) => void;
    attachment: string;
    progress: string;
    title: string;
    id: number;
}

interface IDataContext 
{
    fullscreen: boolean;
    setFullScreen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const DataContext = React.createContext<IDataContext | null>(null);

export function Reader()
{
    const [bookFile, setBookFile] = useState<IBook>(blankBook);
    const [fullscreen, setFullScreen] = useState<boolean>(false);

    const mainBodyRef = useRef<HTMLDivElement>(null);
    const progressTimer = useRef<NodeJS.Timeout | null>(null);
    
    const { type } = useLocation().state;
    const { id } = useParams();

    useEffect(() => 
    {
        async function fetchData()
        {
            setBookFile(await Books.searchById(Number(id)) as IBook);
        }

        fetchData()
    }, []);

    function updateProgress(progress: string)
    {
        if (progressTimer.current)
            clearTimeout(progressTimer.current);

        // Prevents API spams if one changes page rapidly.
        progressTimer.current = setTimeout(() => {
            Books.updateProgress({ 
                id: Number(id), 
                progress: progress 
            })
        }, 1500);
    }

    return (
        <>
            {!fullscreen && (
                <NavBar
                    mobile = {675}
                    mainBodyRef = {mainBodyRef}
                />
            )}
            <div 
                className = "file-reader"
                style = {{ height: !fullscreen ? 'calc(100vh - 3rem)' : '100vh' }}
            >
                {type === 'epub' ? (
                    <DataContext.Provider value = {{ fullscreen, setFullScreen }}>
                        <EpubReader
                            updateProgress = {updateProgress}
                            attachment = {bookFile.attachment!}
                            progress = {bookFile.progress!}
                            title = {bookFile.title}
                            id = {bookFile.id}
                        />
                    </DataContext.Provider>
                ) : (
                    <PdfReader
                        updateProgress = {updateProgress}
                        attachment = {bookFile.attachment!}
                        progress = {bookFile.progress!}
                        title = {bookFile.title}
                        id = {bookFile.id}
                    />
                )}
            </div>
        </>
    )
}