import { selectScenarios } from "../../constants/scenarios";

const API_BASE = "http://localhost:8000";

export async function generateScenarioTree({
  zones,
  projectConfig,
  projectDuration,
  mainConflicts,
  mainSimulationState,
  mainBuildProgress,
  onProgress,
  signal,
}) {
  const selectedScenarios = selectScenarios(projectDuration, mainConflicts);

  const nodes = {};
  const nodesByParent = {};

  const rootId = "node_root";
  nodes[rootId] = {
    id: rootId,
    parentId: null,
    depth: 0,
    day: projectDuration,
    label: "Main Timeline",
    description: "The current project plan as configured.",
    triggerType: "main",
    source: "main",
    probability: 1.0,
    costImpact: 0,
    scheduleDelta: 0,
    simulationState: mainSimulationState,
    buildProgressState: mainBuildProgress,
    conflicts: mainConflicts,
    trajectory: null,
  };
  nodesByParent[rootId] = [];

  const totalUnits =
    selectedScenarios.length +
    selectedScenarios.reduce((n, s) => n + s.recoveries.length, 0);
  let done = 0;

  onProgress(0, totalUnits, "Analyzing scenarios...");

  const scenarioPromises = selectedScenarios.map(async (scenario) => {
    const res = await fetch(`${API_BASE}/api/simulate/scenario`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        zones,
        project_config: projectConfig,
        project_duration: projectDuration,
        perturbation: {
          triggerDay: scenario.triggerDay,
          ...scenario.perturbation,
        },
      }),
      signal,
    });
    if (!res.ok) throw new Error(`Scenario sim failed: ${res.status}`);
    const data = await res.json();
    done += 1;
    onProgress(done, totalUnits, `Completed: ${scenario.label}`);
    return { scenario, data };
  });

  const scenarioResults = await Promise.all(scenarioPromises);

  for (const { scenario, data } of scenarioResults) {
    const nodeId = `node_${scenario.id}`;
    nodes[nodeId] = {
      id: nodeId,
      parentId: rootId,
      depth: 1,
      day: projectDuration,
      triggerDay: scenario.triggerDay,
      label: scenario.label,
      description: scenario.description,
      triggerType: scenario.triggerType,
      source: "preset",
      probability: scenario.baseProbability,
      costImpact: data.total_cost_impact,
      scheduleDelta: data.schedule_delta_days,
      simulationState: data.final_simulation,
      buildProgressState: data.final_build_progress,
      conflicts: data.final_conflicts,
      trajectory: data.trajectory,
      scenarioMeta: scenario,
    };
    nodesByParent[rootId].push(nodeId);
    nodesByParent[nodeId] = [];
  }

  const recoveryPromises = [];
  for (const { scenario } of scenarioResults) {
    for (const recovery of scenario.recoveries) {
      recoveryPromises.push(
        fetch(`${API_BASE}/api/simulate/scenario`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            zones,
            project_config: projectConfig,
            project_duration: projectDuration,
            perturbation: {
              triggerDay: scenario.triggerDay,
              ...recovery.perturbation,
            },
          }),
          signal,
        })
          .then((res) => {
            if (!res.ok) throw new Error(`Recovery sim failed: ${res.status}`);
            return res.json();
          })
          .then((data) => {
            done += 1;
            onProgress(done, totalUnits, `Completed: ${recovery.label}`);
            return { scenario, recovery, data };
          })
      );
    }
  }

  const recoveryResults = await Promise.all(recoveryPromises);

  for (const { scenario, recovery, data } of recoveryResults) {
    const parentId = `node_${scenario.id}`;
    const nodeId = `node_${recovery.id}`;
    nodes[nodeId] = {
      id: nodeId,
      parentId,
      depth: 2,
      day: projectDuration,
      triggerDay: scenario.triggerDay,
      label: recovery.label,
      description: recovery.description,
      triggerType: "recovery_action",
      source: "preset",
      probability: recovery.probability,
      costImpact: data.total_cost_impact,
      scheduleDelta: data.schedule_delta_days,
      simulationState: data.final_simulation,
      buildProgressState: data.final_build_progress,
      conflicts: data.final_conflicts,
      trajectory: data.trajectory,
    };
    if (!nodesByParent[parentId]) nodesByParent[parentId] = [];
    nodesByParent[parentId].push(nodeId);
  }

  return { rootId, nodes, nodesByParent };
}
