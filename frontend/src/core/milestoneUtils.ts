/**
 * Shared milestone status computation used by both
 * - Learner Dashboard milestone tracker
 * - Admin Dashboard Team Performance Monitor
 */

export interface Milestone {
  id: number;
  title: string;
  due_date: string;
  order_index: number;
  is_final_submission: boolean;
}

export type MilestoneState = 'completed' | 'active' | 'upcoming' | 'overdue';

export interface ProcessedMilestone extends Milestone {
  state: MilestoneState;
}

export interface TeamMilestoneStatus {
  label: string;
  type: 'completed' | 'active' | 'overdue' | 'upcoming' | 'no-milestones';
}

/**
 * Process milestones for a given team, taking into account the final submission state.
 * This determines each milestone's visual state (completed, active, upcoming, overdue).
 */
export function processMilestones(
  milestones: Milestone[],
  isFinalSubmitted: boolean
): ProcessedMilestone[] {
  if (!milestones || milestones.length === 0) return [];

  const today = new Date().toISOString().split('T')[0];
  const sorted = [...milestones].sort((a, b) => a.order_index - b.order_index);

  // If final submission is done, mark ALL milestones as completed
  if (isFinalSubmitted) {
    return sorted.map((m) => ({ ...m, state: 'completed' as MilestoneState }));
  }

  let foundActive = false;
  return sorted.map((m) => {
    let state: MilestoneState = 'upcoming';

    if (m.is_final_submission) {
      // Final milestone special handling
      if (isFinalSubmitted) {
        state = 'completed';
      } else if (today > m.due_date) {
        state = 'overdue';
      } else if (!foundActive) {
        state = 'active';
        foundActive = true;
      }
    } else {
      // Intermediate milestones: time-based
      if (today > m.due_date) {
        state = 'completed';
      } else if (!foundActive) {
        state = 'active';
        foundActive = true;
      }
    }

    return { ...m, state };
  });
}

/**
 * Compute a single team-level status label from the cohort milestones.
 * Used for the Team Performance Monitor table status badge.
 */
export function computeTeamMilestoneStatus(
  milestones: Milestone[],
  isFinalSubmitted: boolean
): TeamMilestoneStatus {
  if (!milestones || milestones.length === 0) {
    return { label: 'No Milestones', type: 'no-milestones' };
  }

  // If final submitted, show completed
  if (isFinalSubmitted) {
    return { label: 'Final Submission Completed', type: 'completed' };
  }

  const processed = processMilestones(milestones, isFinalSubmitted);

  // Check for overdue final milestone
  const overdueFinal = processed.find(
    (m) => m.is_final_submission && m.state === 'overdue'
  );
  if (overdueFinal) {
    return { label: 'Overdue', type: 'overdue' };
  }

  // Find the current active milestone
  const activeMilestone = processed.find((m) => m.state === 'active');
  if (activeMilestone) {
    return { label: activeMilestone.title, type: 'active' };
  }

  // All milestones completed (but no final submission – edge case)
  const allCompleted = processed.every((m) => m.state === 'completed');
  if (allCompleted) {
    return { label: 'All Phases Completed', type: 'completed' };
  }

  // Fallback: show next upcoming
  const nextUpcoming = processed.find((m) => m.state === 'upcoming');
  if (nextUpcoming) {
    return { label: nextUpcoming.title, type: 'upcoming' };
  }

  return { label: 'Unknown', type: 'upcoming' };
}
