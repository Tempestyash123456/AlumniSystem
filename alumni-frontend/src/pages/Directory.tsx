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

    if (loading) return <div className="text-center text-gray-500 py-10 animate-pulse">Loading directory...</div>;
    if (error) return <div className="text-center text-red-500 py-10">{error}</div>;

    return (
        <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Alumni Directory</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {alumniList.map((alumni) => (
                    <div key={alumni.id} className="bg-white rounded-xl shadow border border-gray-100 p-6 flex flex-col items-center text-center hover:shadow-lg transition">
                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold mb-4">
                            {alumni.profilePhotoUrl ? (
                                <img src={alumni.profilePhotoUrl} alt="Profile" className="w-full h-full rounded-full object-cover" />
                            ) : (
                                `${alumni.firstName.charAt(0)}${alumni.lastName.charAt(0)}`
                            )}
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">{alumni.firstName} {alumni.lastName}</h3>
                        <p className="text-sm text-gray-500 mt-1">{alumni.email}</p>
                        
                        <button className="mt-4 text-blue-600 text-sm font-semibold hover:underline">
                            View Profile
                        </button>
                    </div>
                ))}
            </div>
            
            {alumniList.length === 0 && (
                <div className="text-center text-gray-500 py-10">No verified alumni found yet.</div>
            )}
        </div>
    );
};

export default Directory;