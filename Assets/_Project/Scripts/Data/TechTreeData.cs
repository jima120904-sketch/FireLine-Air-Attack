using System.Collections.Generic;
using UnityEngine;

namespace FireWing.Data
{
    /// <summary>Aircraft progression graph and purchase prerequisite helpers.</summary>
    [CreateAssetMenu(menuName = "FireWing/Tech Tree")]
    public sealed class TechTreeData : ScriptableObject
    {
        /// <summary>Aircraft nodes in this progression tree.</summary>
        public List<TechTreeNode> nodes = new List<TechTreeNode>();

        /// <summary>Checks ownership, parent, reputation, and cash requirements for an aircraft purchase.</summary>
        /// <param name="aircraft">Aircraft being considered.</param>
        /// <param name="ownedAircraftIds">Identifiers of aircraft currently owned.</param>
        /// <param name="reputation">Current player reputation.</param>
        /// <param name="cash">Current player cash.</param>
        /// <param name="reason">Stable failure code, or an empty string when purchasable.</param>
        /// <returns>True when the aircraft can be purchased.</returns>
        public bool CanUnlock(AircraftData aircraft, IReadOnlyCollection<string> ownedAircraftIds, int reputation, int cash, out string reason)
        {
            reason = string.Empty;
            if (aircraft == null) { reason = "InvalidAircraft"; return false; }
            if (Contains(ownedAircraftIds, aircraft.id)) { reason = "AlreadyOwned"; return false; }
            if (!string.IsNullOrEmpty(aircraft.unlockedByAircraftId) && !Contains(ownedAircraftIds, aircraft.unlockedByAircraftId))
            { reason = "MissingPrerequisite"; return false; }
            if (reputation < aircraft.requiredReputation) { reason = "InsufficientReputation"; return false; }
            if (cash < aircraft.price) { reason = "InsufficientCash"; return false; }
            return true;
        }

        /// <summary>Gets the aircraft nodes directly unlocked by the supplied aircraft.</summary>
        /// <param name="aircraft">Parent aircraft whose children should be returned.</param>
        /// <returns>Direct child aircraft assets, excluding unresolved nodes.</returns>
        public IReadOnlyList<AircraftData> GetChildren(AircraftData aircraft)
        {
            var children = new List<AircraftData>();
            if (aircraft == null) return children;
            for (int i = 0; i < nodes.Count; i++)
            {
                TechTreeNode node = nodes[i];
                if (node != null && node.parentId == aircraft.id && node.aircraft != null) children.Add(node.aircraft);
            }
            return children;
        }

        static bool Contains(IReadOnlyCollection<string> values, string value)
        {
            if (values == null || string.IsNullOrEmpty(value)) return false;
            foreach (string item in values) if (item == value) return true;
            return false;
        }
    }
}