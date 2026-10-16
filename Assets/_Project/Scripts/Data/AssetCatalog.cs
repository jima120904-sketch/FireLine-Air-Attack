using System.Collections.Generic;
using UnityEngine;

namespace FireWing.Data
{
    /// <summary>Central references to aircraft, flight profiles, drop patterns, and progression data.</summary>
    [CreateAssetMenu(menuName = "FireWing/Asset Catalog")]
    public sealed class AssetCatalog : ScriptableObject
    {
        /// <summary>All aircraft available to the project.</summary>
        public List<AircraftData> aircraft = new List<AircraftData>();

        /// <summary>All aircraft flight profiles available to the project.</summary>
        public List<AircraftFlightProfile> flightProfiles = new List<AircraftFlightProfile>();

        /// <summary>All payload drop patterns available to the project.</summary>
        public List<DropPatternData> dropPatterns = new List<DropPatternData>();

        /// <summary>Progression graph connecting the aircraft roster.</summary>
        public TechTreeData techTree;

        /// <summary>Finds an aircraft by its stable identifier.</summary>
        public AircraftData GetAircraft(string id)
        {
            for (int i = 0; i < aircraft.Count; i++) if (aircraft[i] != null && aircraft[i].id == id) return aircraft[i];
            return null;
        }

        /// <summary>Finds a flight profile by its stable identifier.</summary>
        public AircraftFlightProfile GetFlightProfile(string id)
        {
            for (int i = 0; i < flightProfiles.Count; i++) if (flightProfiles[i] != null && flightProfiles[i].id == id) return flightProfiles[i];
            return null;
        }

        /// <summary>Finds a drop pattern by its stable identifier.</summary>
        public DropPatternData GetDropPattern(string id)
        {
            for (int i = 0; i < dropPatterns.Count; i++) if (dropPatterns[i] != null && dropPatterns[i].id == id) return dropPatterns[i];
            return null;
        }
    }
}