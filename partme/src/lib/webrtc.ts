// WebRTC P2P connection helper using native RTCPeerConnection API
// STUN server: stun.cloudflare.com:3478 (free, unlimited)

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.cloudflare.com:3478" },
  { urls: "stun:stun.l.google.com:19302" },
];

export function createPeerConnection(
  onIceCandidate: (candidate: RTCIceCandidate) => void,
  onTrack?: (event: RTCTrackEvent) => void
): RTCPeerConnection {
  const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      onIceCandidate(event.candidate);
    }
  };

  if (onTrack) {
    pc.ontrack = onTrack;
  }

  return pc;
}

export async function createOffer(
  pc: RTCPeerConnection
): Promise<RTCSessionDescriptionInit> {
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  return offer;
}

export async function createAnswer(
  pc: RTCPeerConnection,
  offer: RTCSessionDescriptionInit
): Promise<RTCSessionDescriptionInit> {
  await pc.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  return answer;
}

export async function handleAnswer(
  pc: RTCPeerConnection,
  answer: RTCSessionDescriptionInit
): Promise<void> {
  await pc.setRemoteDescription(new RTCSessionDescription(answer));
}

export async function addIceCandidate(
  pc: RTCPeerConnection,
  candidate: RTCIceCandidateInit
): Promise<void> {
  await pc.addIceCandidate(new RTCIceCandidate(candidate));
}

export async function getMediaStream(
  video: boolean = true,
  audio: boolean = true
): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({ video, audio });
}
