using System.Collections.Generic;
using UnityEngine;

namespace FireWing.Data
{
    /// <summary>Door timing, payload types, and footprint tuning for an aircraft drop.</summary>
    [CreateAssetMenu(menuName = "FireWing/Drop Pattern")]
    public sealed class DropPatternData : ScriptableObject
    {
        /// <summary>Stable drop-pattern identifier used by the asset catalog.</summary>
        public string id;

        /// <summary>Human-readable release-pattern name.</summary>
        public string displayName;

        /// <summary>Number of independently controlled release doors.</summary>
        [Min(1)] public int dropDoorCount = 1;

        /// <summary>Release timing mode used by the payload system.</summary>
        public DropReleaseMode releaseMode = DropReleaseMode.Salvo;

        /// <summary>Supported payload material types.</summary>
        public List<DropPayloadType> supportedPayloads = new List<DropPayloadType> { DropPayloadType.Water };

        /// <summary>Maximum material flow in liters per second.</summary>
        [Min(0f)] public float flowRateLitersPerSecond = 600f;

        /// <summary>Ground-track length in meters at reference drop conditions.</summary>
        [Min(0f)] public float lineLengthMeters = 90f;

        /// <summary>Ground-track width in meters at reference drop conditions.</summary>
        [Min(0f)] public float lineWidthMeters = 24f;

        /// <summary>Reference release altitude above ground in meters.</summary>
        [Min(0f)] public float referenceAltitudeMeters = 35f;

        /// <summary>Reference aircraft speed in meters per second.</summary>
        [Min(0f)] public float referenceSpeedMps = 55f;

        /// <summary>Angular spread of the dropped material in degrees.</summary>
        [Range(0f, 60f)] public float spreadAngleDegrees = 8f;

        /// <summary>Pitch-surge multiplier when a salvo releases the full tank.</summary>
        [Min(0f)] public float pitchSurgeMultiplier = 1f;

        /// <summary>Whether this pattern supports gated batch release.</summary>
        public bool supportsGatedRelease;
    }
}