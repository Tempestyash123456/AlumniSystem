import { useEffect, useState } from 'react';
import api from '../api/axiosConfig';

interface Alumni {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePhotoUrl: string | null;
}

const Directory = () => {
    const [alumniList, setAlumniList] = useState<Alumni[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAlumni = async () => {
            try {
                const response = await api.get('/alumni');
                setAlumniList(response.data.data);
            } catch (err) {
                setError('Failed to load alumni directory.');
            } finally {
                setLoading(false);
            }
        };
        fetchAlumni();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="h-8 w-8 rounded-full border-2 border-t-zinc-50 border-zinc-800 animate-spin"></div>
                <p className="text-sm text-zinc-500">Loading directory...</p>
            </div>
        </div>
    );
    
    if (error) return <div className="text-center text-red-400 py-10 font-medium">{error}</div>;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-semibold tracking-tight">Alumni Directory</h2>
                <p className="text-sm text-zinc-400">Connect with your peers and expand your network.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {alumniList.map((alumni) => (
                    <div key={alumni.id} className="rounded-xl border border-zinc-800 bg-zinc-900/40 text-zinc-50 shadow-sm transition-all hover:bg-zinc-800/40 hover:shadow-md">
                        <div className="p-6 flex flex-col items-center text-center">
                            
                            <div className="w-20 h-20 rounded-full border border-zinc-700 bg-zinc-800 flex items-center justify-center text-xl font-medium text-zinc-300 mb-4 shadow-inner">
                                {alumni.profilePhotoUrl ? (
                                    <img src={alumni.profilePhotoUrl} alt="Profile" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    `${alumni.firstName.charAt(0)}${alumni.lastName.charAt(0)}`
                                )}
                            </div>
                            
                            <h3 className="font-semibold leading-none tracking-tight mb-1">{alumni.firstName} {alumni.lastName}</h3>
                            <p className="text-sm text-zinc-400">{alumni.email}</p>
                            
                            <button className="mt-6 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-300 border border-zinc-800 bg-transparent hover:bg-zinc-800 text-zinc-300 hover:text-zinc-50 h-8 px-4 w-full">
                                View Profile
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            
            {alumniList.length === 0 && (
                <div className="rounded-xl border border-zinc-800 border-dashed p-12 text-center">
                    <p className="text-sm text-zinc-400">No verified alumni found in the network yet.</p>
                </div>
            )}
        </div>
    );
};

export default Directory;