import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/client';
import { useStore } from '../store/useStore';

interface Domain {
  id: string;
  name: string;
}

export default function DomainSelection() {
  const location = useLocation();
  const navigate = useNavigate();
  const setCandidateId = useStore(state => state.setCandidateId);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const registrationData = location.state?.registrationData;

  useEffect(() => {
    if (!registrationData) {
      navigate('/');
      return;
    }

    const fetchDomains = async () => {
      try {
        const response = await api.get('/domains');
        setDomains(response.data);
      } catch (error) {
        console.error('Fetch domains error:', error);
        toast.error('Failed to load domains');
      } finally {
        setFetching(false);
      }
    };

    fetchDomains();
  }, [registrationData, navigate]);

  const toggleDomain = (id: string) => {
    setSelectedDomains(prev => {
      if (prev.includes(id)) {
        return prev.filter(d => d !== id);
      }
      if (prev.length >= 3) {
        toast.warning('You can select a maximum of 3 domains.');
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleSubmit = async () => {
    if (selectedDomains.length < 1 || selectedDomains.length > 3) {
      toast.error('Please select between 1 and 3 domains.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...registrationData,
        domainIds: selectedDomains
      };

      const response = await api.post('/candidates/register', payload);
      setCandidateId(response.data.candidateId);
      
      toast.success(response.data.message || 'Registration complete!');
      navigate('/assessment'); 
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="flex justify-center items-center min-h-screen bg-secondaryBg">Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-secondaryBg md:p-8">
      <div className="bg-white py-10 px-6 md:p-8 md:rounded-2xl md:shadow-xl w-full max-w-2xl md:border border-border min-h-screen md:min-h-0 flex flex-col justify-start md:justify-center">
        <div className="text-center mb-6 md:mb-8 mt-4 md:mt-0">
          <h1 className="text-2xl md:text-3xl font-bold text-primary mb-2">Select Your Domains</h1>
          <p className="text-sm md:text-base text-textSecondary">Choose between 1 and 3 domains for your assessment.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {domains.map((domain) => {
            const isSelected = selectedDomains.includes(domain.id);
            return (
              <div 
                key={domain.id}
                onClick={() => toggleDomain(domain.id)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  isSelected 
                    ? 'border-primary bg-blue-50 shadow-md' 
                    : 'border-border hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded flex items-center justify-center ${isSelected ? 'bg-primary text-white' : 'bg-gray-200'}`}>
                    {isSelected && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className={`font-semibold ${isSelected ? 'text-primary' : 'text-textPrimary'}`}>
                    {domain.name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <button 
          onClick={handleSubmit}
          disabled={loading || selectedDomains.length === 0}
          className={`w-full py-3 rounded-lg font-semibold text-white transition-all duration-300 ${
            selectedDomains.length > 0 && !loading 
              ? 'bg-primary hover:bg-blue-700 shadow-md hover:shadow-lg' 
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          {loading ? 'Submitting...' : 'Start Assessment'}
        </button>
      </div>
    </div>
  );
}
