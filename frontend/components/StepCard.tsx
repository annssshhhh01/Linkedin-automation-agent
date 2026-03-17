type StepCardProps = {
  title: string;
  onClick?: () => void;
};

export default function StepCard({ title, onClick }: StepCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-gray-800 p-6 rounded-xl cursor-pointer hover:scale-105 transition"
    >
      {title}
    </div>
  );
}