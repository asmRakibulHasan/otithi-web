import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import api from '../../api/axios.js';
import useApi from '../../hooks/useApi.js';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import { Loading, ErrorBox } from '../../components/State.jsx';
import { errorMessage } from '../../lib/listing.js';

const emptyVillage = { name: '', area: '', nearestBazar: '', landmark: '' };

export default function LocationsSection({ onChange }) {
  const locations = useApi('/admin/locations');
  const [district, setDistrict] = useState('');
  const [addingTo, setAddingTo] = useState(null); // district id
  const [village, setVillage] = useState(emptyVillage);
  const [error, setError] = useState('');

  const run = async (fn) => {
    setError('');
    try {
      await fn();
      locations.reload();
      onChange?.();
      return true;
    } catch (err) {
      setError(errorMessage(err));
      return false;
    }
  };

  const addDistrict = async (e) => {
    e.preventDefault();
    if (await run(() => api.post('/admin/districts', { name: district }))) setDistrict('');
  };

  const addVillage = async (e) => {
    e.preventDefault();
    if (await run(() => api.post('/admin/villages', { ...village, district: addingTo }))) {
      setVillage(emptyVillage);
      setAddingTo(null);
    }
  };

  const remove = (kind, item) => {
    if (window.confirm(`Remove ${item.name}?`)) run(() => api.delete(`/admin/${kind}/${item._id}`));
  };

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-2xl font-bold">Districts &amp; villages</h2>
        <form onSubmit={addDistrict} className="flex gap-2">
          <label className="sr-only" htmlFor="new-district">New district</label>
          <input id="new-district" className="input max-w-[220px]" placeholder="New district" value={district} onChange={(e) => setDistrict(e.target.value)} />
          <Button type="submit" variant="outline"><Plus size={18} aria-hidden="true" />District</Button>
        </form>
      </div>
      <ErrorBox message={locations.error || error} />
      {locations.loading && <Loading />}

      <div className="grid gap-4 md:grid-cols-2">
        {locations.data?.map((d) => (
          <Card key={d._id} className="flex flex-col gap-3 p-5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-bold">{d.name} <span className="text-sm font-normal text-muted">· {d.villages.length} village{d.villages.length === 1 ? '' : 's'}</span></h3>
              {d.villages.length === 0 && (
                <button type="button" onClick={() => remove('districts', d)} aria-label={`Remove ${d.name}`} className="flex h-11 w-11 items-center justify-center rounded-xl text-danger hover:bg-danger-soft"><Trash2 size={18} /></button>
              )}
            </div>
            <ul className="flex flex-wrap gap-2">
              {d.villages.map((v) => (
                <li key={v._id} className="flex items-center gap-1 rounded-full border border-line bg-ground py-1 pl-3 pr-1 text-sm">
                  {v.name}<span className="text-muted"> · {v.rooms} room{v.rooms === 1 ? '' : 's'}</span>
                  {v.rooms === 0 ? (
                    <button type="button" onClick={() => remove('villages', v)} aria-label={`Remove ${v.name}`} className="flex h-8 w-8 items-center justify-center rounded-full text-danger hover:bg-danger-soft"><Trash2 size={14} /></button>
                  ) : <span className="w-2" />}
                </li>
              ))}
            </ul>
            {addingTo === d._id ? (
              <form onSubmit={addVillage} className="grid gap-2 border-t border-line pt-3 sm:grid-cols-2">
                {[['name', 'Village name'], ['area', 'Area / upazila'], ['nearestBazar', 'Nearest bazar'], ['landmark', 'Main landmark']].map(([k, label]) => (
                  <div key={k}><label className="label" htmlFor={`v-${k}`}>{label}</label>
                    <input id={`v-${k}`} className="input" value={village[k]} onChange={(e) => setVillage({ ...village, [k]: e.target.value })} required={k === 'name'} /></div>
                ))}
                <div className="flex gap-2 sm:col-span-2"><Button type="submit">Add village</Button><Button variant="ghost" onClick={() => setAddingTo(null)}>Cancel</Button></div>
              </form>
            ) : (
              <button type="button" onClick={() => { setAddingTo(d._id); setVillage(emptyVillage); }} className="self-start text-sm font-semibold text-paddy hover:underline">+ Add village</button>
            )}
          </Card>
        ))}
      </div>
    </section>
  );
}
