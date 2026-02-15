import { ALL_BLOC_IDS } from '../types/blocs';
import BlocCard from './BlocCard';

export default function BlocGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
      {ALL_BLOC_IDS.map(id => (
        <BlocCard key={id} blocId={id} />
      ))}
    </div>
  );
}
