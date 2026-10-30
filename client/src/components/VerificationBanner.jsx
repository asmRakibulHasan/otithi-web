import { Clock, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

// Shown under the navbar while a user's ID is waiting for (or failed) admin review.
export default function VerificationBanner() {
  const { user } = useAuth();
  if (!user || user.role === 'admin' || user.status === 'approved') return null;

  const rejected = user.status === 'rejected';
  const Icon = rejected ? XCircle : Clock;
  const action = user.role === 'host' ? 'Listing rooms' : 'Booking requests';

  return (
    <div className={rejected ? 'bg-danger-soft text-danger' : 'bg-mustard-soft text-[#4A3A10]'} role="status">
      <div className="wrap flex items-center gap-3 py-3 text-sm">
        <Icon size={20} aria-hidden="true" className="flex-none" />
        <p>
          {rejected ? (
            <><strong>Verification rejected.</strong> Your ID could not be verified. Please contact the admin.</>
          ) : (
            <><strong>Verification pending.</strong> You can browse stays now. {action} unlock once the admin approves your ID.</>
          )}
        </p>
      </div>
    </div>
  );
}
