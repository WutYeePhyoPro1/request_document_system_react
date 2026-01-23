import { DateInput, TimeInput } from "@mantine/dates";
import { ActionIcon, Input, NumberInput, TextInput } from "@mantine/core";
import { IconCalendar, IconClock } from "@tabler/icons-react";
import React, { useRef } from "react";
import cctvPhoto from "../../../assets/images/ban1.png";
import NavPath from "../../../components/NavPath";

const GeneratorCreate: React.FC = () => {
  const dateRef = useRef<HTMLInputElement>(null);
  const timeRef = useRef<HTMLInputElement>(null);

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

        <div className="flex flex-justify flex-col gap-4">
          <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 lg:gap-8 md:gap-6">
            <DateInput
              ref={dateRef}
              label="Date"
              placeholder="Pick date"
              // clearable
              rightSection={
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  onClick={() => dateRef.current?.focus()}
                >
                  <IconCalendar
                    size={16}
                    stroke={1.5}
                    className="text-blue-700"
                  />
                </ActionIcon>
              }
            />

            <TimeInput
              ref={timeRef}
              label="Time"
              rightSection={
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  onClick={() => timeRef.current?.showPicker()}
                >
                  <IconClock size={16} stroke={1.5} className="text-blue-700" />
                </ActionIcon>
              }
            />
          </div>
          <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 lg:gap-8 md:gap-6">
            <NumberInput
              label="Engine Oil%"
              placeholder="Engine Oil"
              min={1}
              max={100}
            />

            <NumberInput label="Fule%" placeholder="Fule" min={1} max={100} />
          </div>
          <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 lg:gap-8 md:gap-6">
            <NumberInput
              label="Coolant%"
              placeholder="Coolant"
              min={1}
              max={100}
            />

            <NumberInput
              label="Battery Volt"
              placeholder="Volt"
              min={1}
              max={100}
            />
          </div>
          <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 lg:gap-8 md:gap-6">
            <NumberInput label="L1" placeholder="L1" min={1} />

            <NumberInput label="L2" placeholder="L2" min={1} />
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 lg:gap-8 md:gap-6">
            <NumberInput label="L3" placeholder="L3" min={1} />

            <NumberInput label="Total KW" placeholder="KW" min={1} />
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 lg:gap-8 md:gap-6">
            <NumberInput label="VoltageL-L" placeholder="Voltage" min={1} />

            <NumberInput label="GEN KVA" placeholder="KW" min={1} />
          </div>
          <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 lg:gap-8 md:gap-6">
            <NumberInput
              label="Running Hour"
              placeholder="Running Hour"
              min={1}
            />

            <DateInput
              ref={dateRef}
              label="Generator Service Date"
              placeholder="Generator Service Date"
              // clearable
              rightSection={
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  onClick={() => dateRef.current?.focus()}
                >
                  <IconCalendar
                    size={16}
                    stroke={1.5}
                    className="text-blue-700"
                  />
                </ActionIcon>
              }
            />
          </div>
          <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 lg:gap-8 md:gap-6">
            <NumberInput
              label="Generator Cleaning"
              placeholder="Generator Cleaning"
              min={1}
              max={100}
            />
            <TextInput label="Remark" placeholder="Enter Remark" />
          </div>
          <div className="flex justify-center">
            <button className="bg-gradient-to-r from-green-400 to-purple-500 text-white px-6 py-2 rounded-md w-full sm:w-auto">
              Submit
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default GeneratorCreate;
