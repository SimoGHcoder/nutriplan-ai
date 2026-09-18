import AlimentiGrid from '../../../components/alimenti/AlimentiGrid.js';

export const metadata = {
  title: 'Alimenti | NutriPlan AI',
};

export default function AlimentiPage() {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span>🥦</span> Gestione Alimenti
      </h2>
      <AlimentiGrid />
    </div>
  );
}
