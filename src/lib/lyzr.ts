const LYZR_API_KEY = import.meta.env.VITE_LYZR_API_KEY || '';

export const getLyzrResponse = async (agentId: string, sessionId: string, message: string, email: string) => {
  try {
    const response = await fetch('https://agent-prod.studio.lyzr.ai/v3/inference/chat/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': LYZR_API_KEY
      },
      body: JSON.stringify({
        user_id: email || 'anonymous',
        agent_id: agentId,
        session_id: sessionId,
        message: message
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Lyzr API error: ${response.status}`);
    }

    const data = await response.json();
    return data.response;
  } catch (err) {
    console.error('Lyzr Agent error:', err);
    throw err;
  }
};

export const analyzeMeeting = async (reviewText: string, userEmail: string = 'mentor@example.com') => {
  const REVIEW_AGENT_ID = import.meta.env.VITE_LYZR_REVIEW_AGENT_ID || '';
  const sessionId = `review-${Math.random().toString(36).substr(2, 9)}`;
  
  const response = await getLyzrResponse(REVIEW_AGENT_ID, sessionId, `ANALYZE MEETING LOG:\n${reviewText}`, userEmail);
  
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error("Parse review error", e);
    }
  }
  
  // Fallback structure if parsing fails
  return {
    score: 80,
    description: response,
    tips: ["Follow the growth framework", "Focus on specific goals"],
    faults: []
  };
};

export const getMatchingAgent = async (mentee: any, mentors: any[]) => {
  const MATCHMAKER_AGENT_ID = import.meta.env.VITE_LYZR_MATCHMAKER_AGENT_ID || '';
  const sessionId = `admin-match-${Math.random().toString(36).substr(2, 9)}`;
  
  const mentorList = mentors.map(m => `- ${m.career_domain} mentor in ${m.location} (ID: ${m.user_id})`).join('\n');
  const prompt = `FIND THE BEST MATCH FOR THIS MENTEE:\n${JSON.stringify(mentee)}\n\nAVAILABLE MENTORS:\n${mentorList}`;
  
  const response = await getLyzrResponse(MATCHMAKER_AGENT_ID, sessionId, prompt, 'admin@agaram.org');
  
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const data = JSON.parse(jsonMatch[0]);
      return {
        mentor_id: data.mentor_id,
        match_reason: data.reason
      };
    } catch (e) {
      console.error("Parse admin match error", e);
    }
  }
  
  return {
    mentor_id: mentors[0].user_id,
    match_reason: response
  };
};
