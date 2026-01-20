import { DateInput, TimeInput } from "@mantine/dates";
import React from "react";
import cctvPhoto from "../../../assets/images/ban1.png";
import NavPath from "../../../components/NavPath";
import { ActionIcon } from "@mantine/core";
import { IconClock } from "@tabler/icons-react";

const GeneratorCreate: React.FC = () => {
  const ref = React.useRef<HTMLInputElement>(null);
  const pickerControl = (
    <ActionIcon variant="subtle" color="gray" onClick={() => ref.current?.showPicker()}>
      <IconClock size={16} stroke={1.5} />
    </ActionIcon>
  );
  
  return (
    <div className="p-6 space-y-6">
      {/* Header Image */}
      <img
        src={cctvPhoto}
        className="w-full max-h-[260px] object-cover rounded-2xl shadow-lg"
        alt="Banner"
      />

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <NavPath
          segments={[
            { path: "/dashboard", label: "Home" },
            { path: "/dashboard", label: "Dashboard" },
            { path: "/generator", label: "Generator" },
          ]}
        />
      </div>

   <form
  className="
    relative
    overflow-hidden
    rounded-3xl
    border border-white/20
    bg-white/10
    backdrop-blur-xl
    shadow-[0_20px_60px_rgba(0,0,0,0.15)]
    p-6
  "
>
  {/* Liquid light flow */}
  <div className="absolute -inset-1 animate-liquid bg-gradient-to-r from-white/20 via-blue-200/20 to-purple-200/20 blur-2xl opacity-70" />

  {/* Glass noise layer */}
  <div className="absolute inset-0 rounded-3xl bg-white/5 pointer-events-none" />

  <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
    <DateInput
      label="Date"
      placeholder="Pick date"
      clearable
    />

        <TimeInput label="Time" ref={ref} rightSection={pickerControl} clearable />

  </div>
</form>


    </div>
  );
};

export default GeneratorCreate;
