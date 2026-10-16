using UnityEngine;

namespace FireWing.Data
{
    /// <summary>Static aircraft identity, progression requirements, performance limits, and data-asset references.</summary>
    [CreateAssetMenu(menuName = "FireWing/Aircraft")]
    public sealed class AircraftData : ScriptableObject
    {
        /// <summary>Stable aircraft identifier used by saves and the tech tree.</summary>
        public string id;

        /// <summary>Player-facing aircraft name.</summary>
        public string displayName;

        /// <summary>Short aircraft description for the hangar and briefing.</summary>
        [TextArea] public string description;

        /// <summary>Progression tier from one through five.</summary>
        [Range(1, 5)] public int tier = 1;

        /// <summary>Tech-tree branch containing this aircraft.</summary>
        public AircraftBranch branch = AircraftBranch.Light;

        /// <summary>Aircraft identifier that must be owned before this aircraft can be unlocked.</summary>
        public string unlockedByAircraftId;

        /// <summary>Minimum reputation required to purchase this aircraft.</summary>
        [Min(0)] public int requiredReputation;

        /// <summary>Purchase price in mission-earned cash.</summary>
        [Min(0)] public int price;

        /// <summary>Number of installed engines.</summary>
        [Min(1)] public int engineCount = 1;

        /// <summary>Primary engine type.</summary>
        public AircraftEngineType engineType = AircraftEngineType.Turboprop;

        /// <summary>Aircraft prefab used by a gameplay scene.</summary>
        public GameObject prefab;

        /// <summary>Hangar and mission-selection icon.</summary>
        public Sprite icon;

        /// <summary>Empty aircraft mass in kilograms.</summary>
        [Min(1f)] public float emptyMassKg = 3900f;

        /// <summary>Wing area in square meters.</summary>
        [Min(0.1f)] public float wingAreaSquareMeters = 40f;

        /// <summary>Rated engine thrust or equivalent static thrust in newtons.</summary>
        [Min(0f)] public float ratedThrustNewtons = 32000f;

        /// <summary>Nominal cruise speed in meters per second.</summary>
        [Min(0f)] public float cruiseSpeedMetersPerSecond = 60f;

        /// <summary>Clean stall speed in meters per second.</summary>
        [Min(0f)] public float stallSpeedMetersPerSecond = 38f;

        /// <summary>Maximum operating speed in meters per second.</summary>
        [Min(0f)] public float maxSpeedMetersPerSecond = 100f;

        /// <summary>Maximum positive structural load factor in G.</summary>
        [Min(0.1f)] public float maxGForcePositive = 4f;

        /// <summary>Maximum negative structural load factor in G; represented as a negative value.</summary>
        [Min(0.1f)] public float maxGForceNegative = -1.5f;

        /// <summary>Never-exceed speed in meters per second.</summary>
        [Min(0f)] public float neverExceedSpeedMps = 95f;

        /// <summary>Maximum speed with flaps extended in meters per second.</summary>
        [Min(0f)] public float maxFlapsSpeedMps = 58f;

        /// <summary>Maximum speed for gear extension or retraction in meters per second.</summary>
        [Min(0f)] public float maxGearSpeedMps = 70f;

        /// <summary>Maximum fuel capacity in kilograms.</summary>
        [Min(0f)] public float fuelCapacityKg = 700f;

        /// <summary>Maximum firefighting payload capacity in liters.</summary>
        [Min(0f)] public float tankCapacityLiters = 3000f;

        /// <summary>Ground-station payload loading rate in liters per second.</summary>
        [Min(0f)] public float groundLoadRate = 100f;

        /// <summary>Ground-station fuel loading rate in kilograms per second.</summary>
        [Min(0f)] public float groundFuelRate = 2f;

        /// <summary>Maximum water scoop rate in liters per second.</summary>
        [Min(0f)] public float scoopRateLitersPerSecond;

        /// <summary>Whether this aircraft can scoop from an allowed water source.</summary>
        public bool canScoop;

        /// <summary>Flight curves and handling tendencies for this aircraft.</summary>
        public AircraftFlightProfile flightProfile;

        /// <summary>Payload release pattern for this aircraft.</summary>
        public DropPatternData dropPattern;
    }
}