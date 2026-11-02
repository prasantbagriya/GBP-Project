<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'email', 'phone', 'assigned_wing', 'password', 'role', 'status', 'last_login_at'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function isAdmin(): bool
    {
        return ($this->role ?? 'member') === 'admin';
    }

    public function isActive(): bool
    {
        return ($this->status ?? 'active') === 'active';
    }

    /**
     * Get all assigned wings / branch keywords for this user.
     * Admins return ['*'] indicating unrestricted full access.
     *
     * @return array<string>
     */
    public function getAssignedWings(): array
    {
        if ($this->isAdmin()) {
            return ['*'];
        }

        if (! empty($this->assigned_wing)) {
            return array_values(array_filter(array_map('trim', explode(',', $this->assigned_wing))));
        }

        // Auto-detect based on member name or email
        $nameLower = strtolower($this->name.' '.$this->email);
        if (str_contains($nameLower, 'sainik') || str_contains($nameLower, 'vineet')) {
            return ['Prince Sainik School'];
        }
        if (str_contains($nameLower, 'piprali') || str_contains($nameLower, 'abhishek')) {
            return ['PCP Piprali Road'];
        }
        if (str_contains($nameLower, 'hospital') || str_contains($nameLower, 'aditya')) {
            return ['Prince Hospital'];
        }
        if (str_contains($nameLower, 'floreto')) {
            return ['Floreto World School, Sikar'];
        }
        if (str_contains($nameLower, 'medical') || str_contains($nameLower, 'minauti')) {
            return ['Prince Medical College'];
        }
        if (str_contains($nameLower, 'kajla') || (str_contains($nameLower, 'college') && ! str_contains($nameLower, 'medical'))) {
            return ['Prince College Sikar'];
        }
        if (str_contains($nameLower, 'nda') && ! str_contains($nameLower, 'defence')) {
            return ['Prince NDA Academy - NDA (UPSC + SSB)'];
        }
        if (str_contains($nameLower, 'defence') || str_contains($nameLower, 'pda') || str_contains($nameLower, 'nitesh')) {
            return ['Prince Defence Academy'];
        }
        if (str_contains($nameLower, 'jaipur')) {
            return ['PCP Jaipur'];
        }
        if (str_contains($nameLower, 'academy') || str_contains($nameLower, 'fdo')) {
            return ['Prince Academy of Higher Education'];
        }
        if (str_contains($nameLower, 'prime') || str_contains($nameLower, 'rahul')) {
            return ['PCP Sikar (Prime Branch)'];
        }
        if (str_contains($nameLower, 'rbse') || str_contains($nameLower, 'santosh')) {
            return ['Prince RBSE School - Palwas Road Campus'];
        }
        if (str_contains($nameLower, 'lotus')) {
            return ['Prince Lotus Valley School - Palwas Road Campus'];
        }

        return [];
    }

    /**
     * Resolve a canonical location slug for Prince Edu Hub network branches.
     * Prevents overlap between distinct branches (e.g. NDA vs Defence vs Academy).
     */
    public static function resolveLocationSlug(string $text, string $id = ''): ?string
    {
        $t = strtolower(trim($text.' '.$id));

        if (str_contains($t, 'sainik')) {
            return 'sainik';
        }
        if (str_contains($t, 'floreto')) {
            return 'floreto';
        }
        if (str_contains($t, 'hospital')) {
            return 'hospital';
        }
        if (str_contains($t, 'medical') || str_contains($t, 'minauti')) {
            return 'medical';
        }
        if (str_contains($t, 'nda') && ! str_contains($t, 'defence')) {
            return 'nda';
        }
        if (str_contains($t, 'defence') || str_contains($t, 'pda')) {
            return 'defence';
        }
        if (str_contains($t, 'lotus')) {
            return 'lotus';
        }
        if (str_contains($t, 'jaipur')) {
            return 'jaipur';
        }
        if (str_contains($t, 'prime') || str_contains($t, 'rahul')) {
            return 'prime';
        }
        if (str_contains($t, 'piprali')) {
            return 'piprali';
        }
        if (str_contains($t, 'rbse')) {
            return 'rbse_palwas';
        }
        if (str_contains($t, 'college') && ! str_contains($t, 'medical')) {
            return 'college';
        }
        if (str_contains($t, 'academy') && ! str_contains($t, 'nda') && ! str_contains($t, 'defence')) {
            return 'academy';
        }

        return null;
    }

    /**
     * Check if user is authorized to view or manage a specific location profile.
     */
    public function canAccessLocation(string $locationTitle, ?string $locationId = null): bool
    {
        if ($this->isAdmin()) {
            return true;
        }

        $allowed = $this->getAssignedWings();
        if (empty($allowed)) {
            return false;
        }

        // Full wildcard check
        foreach ($allowed as $item) {
            $checkWildcard = strtolower(trim($item));
            if ($checkWildcard === '*' || $checkWildcard === 'all') {
                return true;
            }
        }

        $titleLower = strtolower(trim($locationTitle));
        $idLower = $locationId ? strtolower(trim($locationId)) : '';
        $cleanId = $idLower ? trim(preg_replace('/^(accounts\/[^\/]+\/locations\/|locations\/)/', '', $idLower)) : '';

        // Resolve canonical slug of the requested location
        $locationSlug = self::resolveLocationSlug($titleLower, $cleanId);

        foreach ($allowed as $keyword) {
            $kwLower = strtolower(trim($keyword));
            if (empty($kwLower)) {
                continue;
            }

            $cleanKw = trim(preg_replace('/^(accounts\/[^\/]+\/locations\/|locations\/)/', '', $kwLower));

            // 1. Direct exact match on title or ID
            if ($titleLower !== '' && $titleLower === $kwLower) {
                return true;
            }
            if ($idLower !== '' && ($idLower === $kwLower || $cleanId === $cleanKw)) {
                return true;
            }

            // 2. Canonical branch slug match
            $assignedSlug = self::resolveLocationSlug($kwLower, $cleanKw);
            if ($locationSlug !== null && $assignedSlug !== null) {
                if ($locationSlug === $assignedSlug) {
                    return true;
                }

                // If both have recognized different canonical slugs, strictly disallow cross-access!
                continue;
            }

            // 3. Fallback: tight title containment ONLY if slug was not distinguished
            if ($titleLower !== '' && (str_contains($titleLower, $kwLower) || str_contains($kwLower, $titleLower))) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get chat conversations assigned to this user.
     *
     * @return HasMany<ChatConversation, $this>
     */
    public function assignedChatConversations(): HasMany
    {
        return $this->hasMany(ChatConversation::class, 'assigned_to_user_id');
    }
}
