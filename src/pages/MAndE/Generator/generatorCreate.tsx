import { DateInput, TimeInput } from "@mantine/dates";
import {
  ActionIcon,
  Button,
  Input,
  NumberInput,
  TextInput,
} from "@mantine/core";
import {
  IconCalendar,
  IconClock,
  IconFile,
  IconFileText,
  IconX,
} from "@tabler/icons-react";
import React, { useRef, useState } from "react";
import cctvPhoto from "../../../assets/images/ban1.png";
import NavPath from "../../../components/NavPath";
import { FilesIcon, Loader } from "lucide-react";
import type { InvoiceFile } from "../../../utils/requestDiscountUtil/create";
import { v4 as uuidv4 } from "uuid";
import type { meGeneratorDataType } from "../../../utils/meDataUtil/metype";
import Swal from "sweetalert2";
import { m } from "framer-motion";
import { getStoreGeneratorData } from "../../../api/ME/Generator/generatos";
import { useLocation, useNavigate } from "react-router-dom";

const GeneratorCreate: React.FC = () => {
  const location = useLocation();
  const { formId } = location.state || "";
  const { reAdd } = location.state || "";
  const { generalFormId } = location.state || "";
  console.log("Sub_form_id>>", reAdd, formId, generalFormId);

  const [invoiceFile, setInvoiceFile] = useState<InvoiceFile>([
    { id: uuidv4(), file: null },
  ]);
  const [loading, setLoading] = useState<boolean>(false);
  const addInvoiceFile = () => {
    setInvoiceFile((prev) => [
      ...prev,
      {
        id: Date.now(),
        file: null,
        preview: null,
        type: null,
        name: null,
      },
    ]);
  };
  const removeInvoiceFile = (id) => {
    setInvoiceFile((prev) =>
      prev.filter((item) => {
        if (item.id === id && item.preview) {
          URL.revokeObjectURL(item.preview);
        }
        return item.id !== id;
      }),
    );
  };
  const updateFile = (id, file) => {
    setInvoiceFile((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        if (item.preview) URL.revokeObjectURL(item.preview);

        if (!file) {
          return { ...item, file: null, preview: null, type: null, name: null };
        }

        const fileType = file.type;
        const isImage = fileType.startsWith("image/");
        const isPdf = fileType === "application/pdf";

        return {
          ...item,
          file,
          name: file.name,
          type: isImage ? "image" : isPdf ? "pdf" : "other",
          preview: isImage || isPdf ? URL.createObjectURL(file) : null,
        };
      }),
    );
  };
  const validators = {
    generator_date: "Date is required",
    generator_time: "Time is required",
    engine_oil_level: "Engine Oil % is required",
    fuel_level: "Fuel % is required",
    coolant_level: "Coolant % is required",
    battery_volt_level: "Battery Volt is required",
    l1_level: "L1 is required",
    l2_level: "L2 is required",
    l3_level: "L3 is required",
    total_kw_level: "Total KW is required",
    voltageL_l_level: "Voltage L-L is required",
    gen_kva_level: "GEN KVA is required",
    running_hour: "Running Hour is required",
    generator_service_date: "Service Date is required",
    generator_cleaning_level: "Cleaning Level is required",
    remark: "Remark is required",
  };
  const navigate = useNavigate();
  const handleBack = () => {
    navigate(-1);
  };
  const handleSubmit = async (btnStatus: string) => {
    const formElement = document.querySelector("form") as HTMLFormElement;
    const formData = new FormData(formElement);
    const missingFields: string[] = [];
    formData.append("btn_status", btnStatus);
    // validation
    Object.entries(validators).forEach(([key, message]) => {
      const value = formData.get(key);
      if (!value || value.toString().trim() === "") {
        missingFields.push(message);
      }
    });

    // if (!invoiceFile[0]?.file) {
    //   missingFields.push("Upload file is required");
    // }

    if (missingFields.length > 0) {
      Swal.fire({
        icon: "warning",
        title: "Required Fields Missing",
        html: `
        <ul style="text-align:left">
          ${missingFields.map((f) => `<li>• ${f}</li>`).join("")}
        </ul>
      `,
      });
      return;
    }
    const percentFields = [
      "engine_oil_level",
      "fuel_level",
      "coolant_level",
      "generator_cleaning_level",
    ];

    const rangeErrors: string[] = [];

    percentFields.forEach((field) => {
      const value = Number(formData.get(field));

      if (isNaN(value) || value < 1 || value > 100) {
        rangeErrors.push(
          `${field.replaceAll("_", " ")} must be between 1 and 100`,
        );
      }
    });

    if (rangeErrors.length > 0) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Value",
        html: `
      <ul style="text-align:left">
        ${rangeErrors.map((e) => `<li>• ${e}</li>`).join("")}
      </ul>
    `,
      });
      return;
    }

    // 🔥 append files
    invoiceFile.forEach((fileItem, index) => {
      if (fileItem.file) {
        formData.append(`file[${index}]`, fileItem.file);
      }
    });
setLoading(true);
    try {
      const token = localStorage.getItem("token");

      await getStoreGeneratorData(token, formData);

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Generator data stored successfully",
      });

      formElement.reset(); // optional
      // navigate(`/generator/${formId}`);
      navigate(-1);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong while saving data",
      });
    }finally{
      setLoading(false) ;
    }
  };
const FullPageLoader = () => (
    <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center">
      <Loader size="xl" color="blue" />
    </div>
  );

  
  return (
    <div className="p-6 space-y-6 relative" >
        {loading && <FullPageLoader />}
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
            { path: `/generator/${formId}`, label: "Generator" },
          ]}
        />
      </div>

      <form
        onSubmit={handleSubmit}
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
            <div className="">
              <label htmlFor="">Date</label>
              <input
                required
                name="generator_date"
                type="date"
                className="border focus:outline-blue  p-2 w-full rounded-md focus:outline-2 focus:-outline-offset-2 focus:outline-blue-400"
                style={{ borderColor: "rgb(213, 216, 221)" }}
              />
              <input type="hidden" name="sub_form_id" value={formId} />
              <input
                type="hidden"
                name="reAdd"
                value={reAdd == true ? "reAdd" : ""}
              />
              <input type="hidden" name="generalFormID" value={generalFormId} />
            </div>

            <div className="">
              <label htmlFor="">Time</label>
              <input
                type="time"
                required
                name="generator_time"
                className="border focus:outline-blue  p-2 w-full rounded-md focus:outline-2 focus:-outline-offset-2 focus:outline-blue-400"
                style={{ borderColor: "rgb(213, 216, 221)" }}
              />
            </div>
          </div>
          <div className="relative grid g                rid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 lg:gap-8 md:gap-6">
            <div className="">
              <label htmlFor="">Engine Oil%</label>
              <input
                type="number"
                required
                name="engine_oil_level"
                onWheel={(e) => e.currentTarget.blur()}
                className="border focus:outline-blue  p-2 w-full rounded-md focus:outline-2 focus:-outline-offset-2 focus:outline-blue-400"
                style={{ borderColor: "rgb(213, 216, 221)" }}
              />
            </div>
            <div className="">
              <label htmlFor="">Fule%</label>
              <input
                type="number"
                name="fuel_level"
                required
                onWheel={(e) => e.currentTarget.blur()}
                className="border focus:outline-blue  p-2 w-full rounded-md focus:outline-2 focus:-outline-offset-2 focus:outline-blue-400"
                style={{ borderColor: "rgb(213, 216, 221)" }}
              />
            </div>
          </div>
          <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 lg:gap-8 md:gap-6">
            <div className="">
              <label htmlFor="">Coolant%</label>
              <input
                type="number"
                name="coolant_level"
                required
                onWheel={(e) => e.currentTarget.blur()}
                className="border focus:outline-blue  p-2 w-full rounded-md focus:outline-2 focus:-outline-offset-2 focus:outline-blue-400"
                style={{ borderColor: "rgb(213, 216, 221)" }}
              />
            </div>
            <div className="">
              <label htmlFor="">Battery Volt</label>
              <input
                type="number"
                name="battery_volt_level"
                required
                onWheel={(e) => e.currentTarget.blur()}
                className="border focus:outline-blue  p-2 w-full rounded-md focus:outline-2 focus:-outline-offset-2 focus:outline-blue-400"
                style={{ borderColor: "rgb(213, 216, 221)" }}
              />
            </div>
          </div>
          <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 lg:gap-8 md:gap-6">
            <div className="">
              <label htmlFor="">L1</label>
              <input
                type="number"
                name="l1_level"
                required
                onWheel={(e) => e.currentTarget.blur()}
                className="border focus:outline-blue  p-2 w-full rounded-md focus:outline-2 focus:-outline-offset-2 focus:outline-blue-400"
                style={{ borderColor: "rgb(213, 216, 221)" }}
              />
            </div>

            <div className="">
              <label htmlFor="">L2</label>
              <input
                type="number"
                name="l2_level"
                required
                onWheel={(e) => e.currentTarget.blur()}
                className="border focus:outline-blue  p-2 w-full rounded-md focus:outline-2 focus:-outline-offset-2 focus:outline-blue-400"
                style={{ borderColor: "rgb(213, 216, 221)" }}
              />
            </div>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 lg:gap-8 md:gap-6">
            <div className="">
              <label htmlFor="">L3</label>
              <input
                type="number"
                name="l3_level"
                required
                onWheel={(e) => e.currentTarget.blur()}
                className="border focus:outline-blue  p-2 w-full rounded-md focus:outline-2 focus:-outline-offset-2 focus:outline-blue-400"
                style={{ borderColor: "rgb(213, 216, 221)" }}
              />
            </div>
            <div className="">
              <label htmlFor=""> Total KW</label>
              <input
                type="number"
                name="total_kw_level"
                required
                onWheel={(e) => e.currentTarget.blur()}
                className="border focus:outline-blue  p-2 w-full rounded-md focus:outline-2 focus:-outline-offset-2 focus:outline-blue-400"
                style={{ borderColor: "rgb(213, 216, 221)" }}
              />
            </div>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 lg:gap-8 md:gap-6">
            <div className="">
              <label htmlFor=""> VoltageL-L</label>
              <input
                type="number"
                name="voltageL_l_level"
                required
                onWheel={(e) => e.currentTarget.blur()}
                className="border focus:outline-blue  p-2 w-full rounded-md focus:outline-2 focus:-outline-offset-2 focus:outline-blue-400"
                style={{ borderColor: "rgb(213, 216, 221)" }}
              />
            </div>
            <div className="">
              <label htmlFor=""> GEN KVA</label>
              <input
                type="number"
                name="gen_kva_level"
                required
                onWheel={(e) => e.currentTarget.blur()}
                className="border focus:outline-blue  p-2 w-full rounded-md focus:outline-2 focus:-outline-offset-2 focus:outline-blue-400"
                style={{ borderColor: "rgb(213, 216, 221)" }}
              />
            </div>
          </div>
          <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 lg:gap-8 md:gap-6">
            <div className="">
              <label htmlFor=""> Running Hour</label>
              <input
                type="number"
                name="running_hour"
                required
                onWheel={(e) => e.currentTarget.blur()}
                className="border focus:outline-blue  p-2 w-full rounded-md focus:outline-2 focus:-outline-offset-2 focus:outline-blue-400"
                style={{ borderColor: "rgb(213, 216, 221)" }}
              />
            </div>
            <div className="">
              <label htmlFor=""> Generator Service Date</label>
              <input
                type="date"
                name="generator_service_date"
                required
                onWheel={(e) => e.currentTarget.blur()}
                className="border focus:outline-blue  p-2 w-full rounded-md focus:outline-2 focus:-outline-offset-2 focus:outline-blue-400"
                style={{ borderColor: "rgb(213, 216, 221)" }}
              />
            </div>
          </div>
          <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 lg:gap-8 md:gap-6">
            <div className="">
              <label htmlFor=""> Generator Cleaning</label>
              <input
                type="number"
                name="generator_cleaning_level"
                required
                onWheel={(e) => e.currentTarget.blur()}
                className="border focus:outline-blue  p-2 w-full rounded-md focus:outline-2 focus:-outline-offset-2 focus:outline-blue-400"
                style={{ borderColor: "rgb(213, 216, 221)" }}
              />
            </div>
            <div className="">
              <label htmlFor=""> Remark</label>
              <textarea
                name="remark"
                id=""
                cols="3"
                rows="1"
                className="border focus:outline-blue  p-2 w-full rounded-md focus:outline-2 focus:-outline-offset-2 focus:outline-blue-400"
                style={{ borderColor: "rgb(213, 216, 221)" }}
              ></textarea>
            </div>
          </div>
          <div className="relative grid grid-cols-1 md:grid-cols-2   gap-4 lg:gap-12 md:gap-8 items-end">
            {invoiceFile.map((fileField, index) => (
              <div key={fileField.id} className="flex flex-col gap-2 w-full">
                <label htmlFor="">{index === 0 ? "Upload" : undefined}</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    name="file[]"
                    required
                    onChange={(e) =>
                      updateFile(fileField.id, e.target.files?.[0] || null)
                    }
                    className="flex-1 border focus:outline-blue  p-2 w-full rounded-md focus:outline-2 focus:-outline-offset-2 focus:outline-blue-400"
                    style={{ borderColor: "rgb(213, 216, 221)" }}
                  />

                  {index === 0 ? (
                    <Button onClick={addInvoiceFile}>Add</Button>
                  ) : (
                    <Button
                      color="red"
                      onClick={() => removeInvoiceFile(fileField.id)}
                    >
                      <IconX size={16} />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            <div className="flex flex-wrap gap-3 mt-2">
              {invoiceFile
                .filter((f) => f.file)
                .map((fileField) => (
                  <div
                    key={`preview-${fileField.id}`}
                    className="w-40 p-2 border rounded-md flex items-center justify-center"
                  >
                    {/* IMAGE */}
                    {fileField.type === "image" && (
                      <a
                        href={fileField.preview}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <img
                          src={fileField.preview}
                          alt="Preview"
                          className="w-40  object-cover rounded"
                        />
                      </a>
                    )}

                    {/* PDF */}
                    {fileField.type === "pdf" && (
                      <a
                        href={fileField.preview}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center gap-1"
                      >
                        <IconFileText size={32} className="text-red-500" />
                        <span className="text-xs text-center break-all">
                          {fileField.name}
                        </span>
                      </a>
                    )}

                    {/* OTHER FILE */}
                    {fileField.type === "other" && (
                      <div className="flex flex-col items-center gap-2 text-center">
                        <IconFile size={32} className="text-gray-500" />
                        <span className="text-xs break-all">
                          {fileField.name}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
          {reAdd == true ? (
            <div className="flex justify-center gap-12">
              <Button
                type="button"
                onClick={() => handleSubmit("Default")}
                disabled={loading}
                color="green"
                radius="md"
              >
                {loading ? "Processing..." : "Submit"}
              </Button>
              <Button
                type="button"
                onClick={() => navigate(-1)}
                disabled={loading}
                color="red"
                radius="md"
              >
                {loading ? "Processing..." : "Cancel"}
              </Button>
            </div>
          ) : (
            <div className="flex justify-center gap-12">
              <Button
                type="button"
                onClick={() => handleSubmit("Default")}
                disabled={loading}
                color="green"
                radius="md"
              >
                {loading ? "Processing..." : "Save as Draft"}
              </Button>

              <Button
                type="button"
                onClick={() => handleSubmit("Ongoing")}
                disabled={loading}
                color="blue"
                radius="md"
              >
                {loading ? "Processing..." : "Send to Manager"}
              </Button>
              <Button
                type="button"
                onClick={() => navigate(-1)}
                disabled={loading}
                color="red"
                radius="md"
              >
                {loading ? "Processing..." : "Cancel"}
              </Button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default GeneratorCreate;
