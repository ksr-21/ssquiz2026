import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import { useStore } from '../store/useStore';

interface RegistrationData {
  fullName: string;
  email: string;
  mobileNumber: string;
  college: string;
  yearOfStudy: string;
  branch: string;
  linkedInProfile?: string;
  declarationAccepted: boolean;
}

export default function Registration() {
  const navigate = useNavigate();
  const setCandidateId = useStore(state => state.setCandidateId);
  const { register, handleSubmit, formState: { errors, isValid } } = useForm<RegistrationData>({ mode: 'onChange' });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: RegistrationData) => {
    try {
      setLoading(true);
      // We need to save this to state and navigate to Domains, because domains are required for registration API
      // Actually, wait, the API requires domains to register. 
      // So we should navigate to DomainSelection and pass this data, OR register partially and update later.
      // The implementation plan says Registration API needs domainIds. So we just pass data to next page using state.
      navigate('/domains', { state: { registrationData: data } });
    } catch (error: any) {
      toast.error('Something went wrong!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-secondaryBg md:p-8">
      <div className="bg-white py-10 px-6 md:p-8 md:rounded-2xl md:shadow-xl w-full max-w-2xl md:border border-border min-h-screen md:min-h-0 flex flex-col justify-start md:justify-center">
        <div className="text-center mb-6 md:mb-8 mt-4 md:mt-0">
          <h1 className="text-2xl md:text-3xl font-bold text-primary mb-2">Success Squad Assessment</h1>
          <p className="text-sm md:text-base text-textSecondary">Please fill in your details to start the registration process.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-textPrimary mb-1">Full Name *</label>
              <input 
                {...register('fullName', { required: 'Full Name is required' })} 
                className="w-full px-4 py-3 md:py-2 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder="John Doe"
              />
              {errors.fullName && <p className="text-error text-xs mt-1">{errors.fullName.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-textPrimary mb-1">Email Address *</label>
              <input 
                {...register('email', { 
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }
                })} 
                className="w-full px-4 py-3 md:py-2 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder="john@example.com"
              />
              {errors.email && <p className="text-error text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-textPrimary mb-1">Mobile Number *</label>
              <input 
                {...register('mobileNumber', { 
                  required: 'Mobile Number is required',
                  pattern: { value: /^[0-9]{10}$/, message: 'Must be 10 digits' }
                })} 
                className="w-full px-4 py-3 md:py-2 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder="9876543210"
              />
              {errors.mobileNumber && <p className="text-error text-xs mt-1">{errors.mobileNumber.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-textPrimary mb-1">College *</label>
              <select 
                {...register('college', { required: 'College is required' })}
                className="w-full px-4 py-3 md:py-2 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition bg-white"
              >
                <option value="">Select College</option>
                <option value="JSPM NTC">JSPM NTC</option>
                <option value="TSSM BSCOER">TSSM BSCOER</option>
              </select>
              {errors.college && <p className="text-error text-xs mt-1">{errors.college.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-textPrimary mb-1">Year of Study *</label>
              <select 
                {...register('yearOfStudy', { required: 'Year is required' })}
                className="w-full px-4 py-3 md:py-2 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition bg-white"
              >
                <option value="">Select Year</option>
                <option value="Second Year">Second Year</option>
                <option value="Third Year">Third Year</option>
                <option value="Final Year">Final Year</option>
              </select>
              {errors.yearOfStudy && <p className="text-error text-xs mt-1">{errors.yearOfStudy.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-textPrimary mb-1">Branch *</label>
              <select 
                {...register('branch', { required: 'Branch is required' })}
                className="w-full px-4 py-3 md:py-2 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition bg-white"
              >
                <option value="">Select Your Branch</option>
                <option value="Computer Engineering">Computer Engineering</option>
                <option value="Artificial Intelligence & Data Science">Artificial Intelligence & Data Science</option>
                <option value="Electronics & Telecommunication">Electronics & Telecommunication</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Civil Engineering">Civil Engineering</option>
                <option value="Electrical Engineering">Electrical Engineering</option>
                <option value="Other">Other</option>
              </select>
              {errors.branch && <p className="text-error text-xs mt-1">{errors.branch.message}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-textPrimary mb-1">LinkedIn Profile (Optional)</label>
              <input 
                {...register('linkedInProfile')} 
                className="w-full px-4 py-2 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder="https://linkedin.com/in/johndoe"
              />
            </div>
          </div>

          <div className="bg-secondaryBg p-4 rounded-lg border border-border mt-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                {...register('declarationAccepted', { required: 'You must accept the declaration' })}
                className="mt-1 w-4 h-4 text-primary rounded focus:ring-primary"
              />
              <span className="text-sm text-textSecondary leading-relaxed">
                I hereby declare that all the information provided by me is true and correct. I understand that any unfair practices during the assessment may result in immediate termination of my examination and disqualification from the recruitment process.
              </span>
            </label>
            {errors.declarationAccepted && <p className="text-error text-xs mt-2 ml-7">{errors.declarationAccepted.message}</p>}
          </div>

          <button 
            type="submit" 
            disabled={!isValid || loading}
            className={`w-full py-3 rounded-lg font-semibold text-white transition-all duration-300 ${
              isValid && !loading 
                ? 'bg-primary hover:bg-blue-700 shadow-md hover:shadow-lg' 
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {loading ? 'Processing...' : 'Proceed to Domain Selection'}
          </button>
        </form>
      </div>
    </div>
  );
}
