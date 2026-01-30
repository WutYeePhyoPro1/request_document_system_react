import React from "react";
import type { meGeneratorDataType } from "../../../utils/meDataUtil/metype";
import { Modal, Table, type TableData } from "@mantine/core";
import { Group, Button } from "@mantine/core";
import {
  IconEdit,
  IconFile,
  IconFileAi,
  IconFileAlert,
  IconPhoto,
  IconTrash,
} from "@tabler/icons-react";
import { FileIcon, FileImageIcon } from "lucide-react";
import { useDisclosure } from "@mantine/hooks";
import { Link } from "react-router-dom";

const TableDetail: React.FC<Props> = ({ detailData }) => {
  const { detailData: generator, files, generalForm } = detailData;
  const [fileOpened, { open: openFileModal, close: closeFileModal }] =
    useDisclosure(false);
  const handleEdit = (id?: number) => {
    if (!id) return;
    console.log("Edit ID:", id);
  };

  const handleDelete = (id?: number) => {
    if (!id) return;
    if (!confirm("Are you sure you want to delete this record?")) return;

    console.log("Delete ID:", id);
  };

  // console.log("DetailData>>", detailData);
  const isImageFile = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  };

  const isPdfFile = (url: string) => {
    return /\.pdf$/i.test(url);
  };
  const tableData: TableData = {
    head: [
      "No",
      "Date",
      "Time",
      "Engine Oil",
      "Fuel",
      "Coolant",
      "Battery Volt",
      "L1",
      "L2",
      "L3",
      "Total KW",
      "Voltage L-L",
      "Generator Kva",
      "Running Hour",
      "Service Date",
      "Cleaning Level",
      "Remark",
      "Image",
      "Action",
    ],
    body: detailData
      ? [
          [
            1,
            generator?.generator_date,
            generator?.generator_time_ampm,
            generator?.engine_oil_level,
            generator?.fuel_level,
            generator?.coolant_level,
            generator?.battery_volt_level,
            generator?.l1_level,
            generator?.l2_level,
            generator?.l3_level,
            generator?.total_kw_level,
            generator?.voltageL_l_level,
            generator?.gen_kva_level,
            generator?.running_hour,
            generator?.generator_service_date,
            generator?.generator_cleaning_level,
            generator?.remark,
            <span className="inline-flex items-center justify-center text-blue-700 text-lg">
              {files?.length > 0 && (
                <span className="inline-flex items-center justify-center text-blue-700 text-lg">
                  {files?.length > 0 ? (
                    <button
                      type="button"
                      onClick={openFileModal}
                      className="hover:text-blue-900 transition"
                    >
                      <IconFile size={18} />
                    </button>
                  ) : (
                    <span className="text-sm text-gray-400">No file</span>
                  )}
                </span>
              )}
            </span>,
            <Group gap="xs" key="action">
              <Link
                state={{ generalForm }}
                to={`/generator_edit/${generator?.id}`}
                className="contents"
              >
                <Button
                  size="xs"
                  variant="light"
                  color="blue"
                  onClick={() => handleEdit(generator?.id)}
                >
                  <IconEdit size={16} />
                </Button>
              </Link>
              <Button
                size="xs"
                variant="light"
                color="red"
                onClick={() => handleDelete(generator?.id)}
              >
                <IconTrash size={16} />
              </Button>
            </Group>,
          ],
        ]
      : [],
  };

  return (
    <div className="mt-6 overflow-x-auto">
      <Table
        data={tableData}
        styles={{
          thead: { backgroundColor: "#A9D8E9" },
          th: { backgroundColor: "inherit" },
        }}
      />
      <Modal
        opened={fileOpened}
        onClose={closeFileModal}
        title="Attached Files"
        size="lg"
        centered
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {files?.map((file, i) => {
            const isPDF = file.file_url.toLowerCase().endsWith(".pdf");

            return (
              <div
                key={i}
                className="flex flex-col items-center gap-2 border rounded-lg p-2"
              >
                {isPDF ? (
                  <IconFile size={48} className="text-red-500" />
                ) : (
                  <img
                    src={file.file_url}
                    alt={file.name}
                    className="w-full h-32 object-cover rounded"
                  />
                )}

                <a
                  href={file.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 underline truncate w-full text-center"
                >
                  {file.name}
                </a>
              </div>
            );
          })}
        </div>
      </Modal>
    </div>
  );
};

export default TableDetail;
