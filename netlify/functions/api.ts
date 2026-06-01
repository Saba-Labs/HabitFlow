import { getServerlessHandler } from "../../server/serverless-handler";

export const handler = async (event: unknown, context: unknown) => {
  const appHandler = await getServerlessHandler();
  return appHandler(event, context);
};
