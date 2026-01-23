import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { meDataDetail } from "../../../api/ME/meData";
import type { meGeneratorDataType } from "../../../utils/meDataUtil/metype";

const GeneratorDetail: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [detailData, setDetailData] = useState<meGeneratorDataType | null>(
    null,
  );

  const { id } = useParams<{ id: string }>();
  console.log("ID>>", id, typeof id);
  useEffect(() => {
    if (!id) return;

    const fetchData = async (id: string) => {
      const token = localStorage.getItem("token");
      if (!token) return;

      setLoading(true);
      try {
        const data = await meDataDetail(token, id);
        setDetailData(data);
      } catch (error) {
        console.error("GeneratorDetail error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData(Number(id));
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!detailData) return <div>No Data Found</div>;

  return (
    <div>
      <h2>Generator Detail</h2>
      <p>Running Hour: {detailData.running_hour}</p>
      <p>Fuel Level: {detailData.fuel_level}</p>
      <p>Remark: {detailData.remark}</p>
    </div>
  );
};

export default GeneratorDetail;
