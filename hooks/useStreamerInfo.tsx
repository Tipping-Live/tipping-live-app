import { useQuery } from "@tanstack/react-query";

export const useStreamInfo = ({
    streamId
}: {
    streamId: string;
}) => {
    return useQuery({
        queryKey: ["getStreamInfo", streamId],
        queryFn: async () => {
            // TODO: call api to get the backend data
            return {
                id: streamId,
                title: "Demo Stream",
                description: "This is the demo stram 001!",
                streamer: {
                    name: "Host-001",
                    address: `0x123`,
                    avatar: ``,
                },
            }
        },
        enabled: !!streamId
    })
}
export default useStreamInfo;