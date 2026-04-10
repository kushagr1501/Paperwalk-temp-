"use client";

const TOPICS = [
  { label: "All", query: "" },
  { label: "Transformers", query: "transformer attention mechanism" },
  { label: "GPU Architecture", query: "GPU microarchitecture memory bandwidth" },
  { label: "HPC", query: "high performance computing parallel" },
  { label: "CPU / Microarch", query: "CPU pipeline branch prediction cache" },
  { label: "Distributed", query: "distributed consensus fault tolerance" },
  { label: "Filesystems", query: "filesystem storage POSIX" },
  { label: "ML Inference", query: "inference optimization quantization" },
  { label: "CUDA", query: "CUDA parallel programming warp" },
  { label: "RL", query: "reinforcement learning policy gradient" },
  { label: "Deep Learning", query: "deep learning neural network training" },
];

interface TopicHubsProps {
  activeQuery: string;
  onSelect: (query: string) => void;
}

export function TopicHubs({ activeQuery, onSelect }: TopicHubsProps) {
  return (
    <div className="flex space-x-2 w-full max-w-2xl overflow-x-auto pb-2 font-sans text-xs scrollbar-hide">
      {TOPICS.map((topic) => {
        const isActive = activeQuery === topic.query;
        return (
          <button
            key={topic.label}
            onClick={() => onSelect(topic.query)}
            className={`px-3.5 py-1.5 rounded-full whitespace-nowrap transition-colors flex-shrink-0 border ${
              isActive
                ? "bg-accent text-white border-accent"
                : "bg-surface border-bordercolor text-textmuted hover:border-accent-dim hover:text-textpri"
            }`}
          >
            {topic.label}
          </button>
        );
      })}
    </div>
  );
}
