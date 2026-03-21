import React, { useEffect, useState } from "react";
import type { meGeneratorDataType } from "../../../utils/meDataUtil/metype";
import { useParams } from "react-router-dom";
import { transformerDetailData } from "../../../api/ME/Transformer/transformer";
import { handleCopy } from "../../../utils/requestDiscountUtil/helper";

const TransformerDetail: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [detailData, setDetailData] = useState<meGeneratorDataType | null>();
  const [copied, setCopied] = useState<boolean>(false);
  const { id } = useParams<{ id: string }>();
  useEffect(() => {
    if (!id) return;
    fetchData(id);
  }, [id]);
  const fetchData = async (id: string | number) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoading(true);
    try {
      const data = await transformerDetailData(token, id);
      setDetailData(data);
    } catch (error) {
      console.error("TransformerDetail error:", error);
    } finally {
      setLoading(false);
    }
  };

  const onCopyClick = () => {
    handleCopy(
      detailData?.generalForm?.form_doc_no || "",
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      (err) => {
        console.log("Copy Failed:", err);
      },
    );
  };
  return <div>Hello Detail</div>;
};

export default TransformerDetail;
