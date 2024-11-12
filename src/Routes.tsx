import { HashRouter, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { EditBook } from './pages/EditBook';
import { EditTags } from './pages/EditTags';
import { NewBook } from './pages/NewBook';
import { Reader } from './pages/Reader';
import { Home } from './pages/Home';

import { Database } from './database/backend';
import { Loading } from './components/Loading';

export function AppRoutes()
{
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => 
    {
        const checkIndexedDB = async () => 
        {
            // Open the database and check for entries every 100ms
            const db = await Database.getDatabase();
        
            const intervalId = setInterval(async () => 
            {
                try {

                    const transaction = db.transaction(['defaultData'], 'readonly');
                    const store = transaction.objectStore('defaultData');
                    
                    const request = store.index('exists').getAll();
                    
                    request.onsuccess = () => 
                    {
                        if (request.result.length) 
                        {
                            clearInterval(intervalId);
                            setLoading(false); 
                        } 
                    };
                } 
                catch (error) 
                {

                }
            }, 500);
    
            return () => clearInterval(intervalId); // Clean up the interval on component unmount
        };
    
        checkIndexedDB();
    }, []);

    return(
        <>
            {loading ? (
                <Loading/>
            ) : (
                <HashRouter>
                    <Routes>
                        <Route path = '/' element = {<Home/>}/>
                        <Route path = 'new' element = {<NewBook/>}/>
                        <Route path = 'edit/:id' element = {<EditBook/>}/>
                        <Route path = 'read/:id' element = {<Reader/>}/>
                        <Route path = 'tags' element = {<EditTags/>}/>
                    </Routes>
                </HashRouter>
            )}
        </>
    )
}