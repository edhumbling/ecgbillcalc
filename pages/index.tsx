import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: "/ecg-bill-calculator",
      permanent: false,
    },
  };
};

export default function Redirect() { return null; }
