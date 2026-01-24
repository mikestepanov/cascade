import { describe, expect, it } from "vitest";
import {
  ARRAY_LIMITS,
  STRING_LIMITS,
  validate,
  validateArrayLength,
  validateEmail,
  validateProjectKey,
  validateSlug,
  validateStringLength,
  validateUrl,
} from "./constrainedValidators";

describe("constrained validators", () => {
  describe("STRING_LIMITS", () => {
    it("should have correct KEY limits", () => {
      expect(STRING_LIMITS.KEY).toEqual({ min: 1, max: 10 });
    });

    it("should have correct NAME limits", () => {
      expect(STRING_LIMITS.NAME).toEqual({ min: 1, max: 100 });
    });

    it("should have correct TITLE limits", () => {
      expect(STRING_LIMITS.TITLE).toEqual({ min: 1, max: 200 });
    });

    it("should have correct DESCRIPTION limits", () => {
      expect(STRING_LIMITS.DESCRIPTION).toEqual({ min: 0, max: 10000 });
    });

    it("should have correct URL limits", () => {
      expect(STRING_LIMITS.URL).toEqual({ min: 0, max: 2048 });
    });

    it("should have correct EMAIL limits", () => {
      expect(STRING_LIMITS.EMAIL).toEqual({ min: 3, max: 254 });
    });

    it("should have correct SLUG limits", () => {
      expect(STRING_LIMITS.SLUG).toEqual({ min: 1, max: 50 });
    });
  });

  describe("ARRAY_LIMITS", () => {
    it("should have correct TAGS limits", () => {
      expect(ARRAY_LIMITS.TAGS).toEqual({ min: 0, max: 50 });
    });

    it("should have correct MEMBERS limits", () => {
      expect(ARRAY_LIMITS.MEMBERS).toEqual({ min: 0, max: 100 });
    });

    it("should have correct BULK_IDS limits", () => {
      expect(ARRAY_LIMITS.BULK_IDS).toEqual({ min: 1, max: 100 });
    });

    it("should have correct WORKFLOW_STATES limits", () => {
      expect(ARRAY_LIMITS.WORKFLOW_STATES).toEqual({ min: 1, max: 20 });
    });
  });

  describe("validateStringLength", () => {
    it("should accept valid string within limits", () => {
      expect(() => validateStringLength("hello", "field", 1, 10)).not.toThrow();
    });

    it("should accept string at minimum length", () => {
      expect(() => validateStringLength("a", "field", 1, 10)).not.toThrow();
    });

    it("should accept string at maximum length", () => {
      expect(() => validateStringLength("abcdefghij", "field", 1, 10)).not.toThrow();
    });

    it("should throw for string below minimum length", () => {
      expect(() => validateStringLength("", "title", 1, 10)).toThrow(
        "title must be at least 1 characters (got 0)",
      );
    });

    it("should throw for string above maximum length", () => {
      expect(() => validateStringLength("this is too long", "name", 1, 5)).toThrow(
        "name must be at most 5 characters (got 16)",
      );
    });

    it("should accept empty string when min is 0", () => {
      expect(() => validateStringLength("", "description", 0, 1000)).not.toThrow();
    });
  });

  describe("validateArrayLength", () => {
    it("should accept valid array within limits", () => {
      expect(() => validateArrayLength([1, 2, 3], "items", 1, 10)).not.toThrow();
    });

    it("should accept array at minimum length", () => {
      expect(() => validateArrayLength([1], "items", 1, 10)).not.toThrow();
    });

    it("should accept array at maximum length", () => {
      const arr = Array(10).fill(1);
      expect(() => validateArrayLength(arr, "items", 1, 10)).not.toThrow();
    });

    it("should throw for array below minimum length", () => {
      expect(() => validateArrayLength([], "ids", 1, 10)).toThrow(
        "ids must have at least 1 items (got 0)",
      );
    });

    it("should throw for array above maximum length", () => {
      const arr = Array(15).fill(1);
      expect(() => validateArrayLength(arr, "tags", 0, 10)).toThrow(
        "tags must have at most 10 items (got 15)",
      );
    });

    it("should accept empty array when min is 0", () => {
      expect(() => validateArrayLength([], "tags", 0, 50)).not.toThrow();
    });
  });

  describe("validateProjectKey", () => {
    it("should accept valid project keys", () => {
      expect(() => validateProjectKey("AB")).not.toThrow();
      expect(() => validateProjectKey("PROJ")).not.toThrow();
      expect(() => validateProjectKey("P1")).not.toThrow();
      expect(() => validateProjectKey("ABC123")).not.toThrow();
      expect(() => validateProjectKey("ABCDEFGHIJ")).not.toThrow(); // 10 chars max
    });

    it("should accept lowercase and convert to uppercase", () => {
      expect(() => validateProjectKey("proj")).not.toThrow();
      expect(() => validateProjectKey("Abc")).not.toThrow();
    });

    it("should trim whitespace", () => {
      expect(() => validateProjectKey("  PROJ  ")).not.toThrow();
    });

    it("should reject single character", () => {
      expect(() => validateProjectKey("A")).toThrow(
        "Project key must be 2-10 uppercase alphanumeric characters, starting with a letter",
      );
    });

    it("should reject keys starting with number", () => {
      expect(() => validateProjectKey("1ABC")).toThrow(
        "Project key must be 2-10 uppercase alphanumeric characters",
      );
    });

    it("should reject keys with special characters", () => {
      expect(() => validateProjectKey("AB-C")).toThrow(
        "Project key must be 2-10 uppercase alphanumeric characters",
      );
      expect(() => validateProjectKey("AB_C")).toThrow();
      expect(() => validateProjectKey("AB C")).toThrow();
    });

    it("should reject keys longer than 10 characters", () => {
      expect(() => validateProjectKey("ABCDEFGHIJK")).toThrow(
        "Project key must be 2-10 uppercase alphanumeric characters",
      );
    });
  });

  describe("validateSlug", () => {
    it("should accept valid slugs", () => {
      expect(() => validateSlug("a")).not.toThrow();
      expect(() => validateSlug("abc")).not.toThrow();
      expect(() => validateSlug("my-project")).not.toThrow();
      expect(() => validateSlug("project-123")).not.toThrow();
      expect(() => validateSlug("123")).not.toThrow();
    });

    it("should reject slugs starting with hyphen", () => {
      expect(() => validateSlug("-abc")).toThrow("must be lowercase letters, numbers, and hyphens");
    });

    it("should reject slugs ending with hyphen", () => {
      expect(() => validateSlug("abc-")).toThrow("must be lowercase letters, numbers, and hyphens");
    });

    it("should reject uppercase characters", () => {
      expect(() => validateSlug("MyProject")).toThrow(
        "must be lowercase letters, numbers, and hyphens",
      );
    });

    it("should reject special characters", () => {
      expect(() => validateSlug("my_project")).toThrow();
      expect(() => validateSlug("my.project")).toThrow();
      expect(() => validateSlug("my project")).toThrow();
    });

    it("should reject slugs longer than 50 characters", () => {
      const longSlug = "a".repeat(51);
      expect(() => validateSlug(longSlug)).toThrow("must be at most 50 characters");
    });

    it("should use custom field name in error", () => {
      expect(() => validateSlug("-abc", "workspaceSlug")).toThrow(
        "workspaceSlug must be lowercase",
      );
    });
  });

  describe("validateEmail", () => {
    it("should accept valid emails", () => {
      expect(() => validateEmail("user@example.com")).not.toThrow();
      expect(() => validateEmail("test.user@domain.org")).not.toThrow();
      expect(() => validateEmail("a@b.c")).not.toThrow();
    });

    it("should reject email without @", () => {
      expect(() => validateEmail("userexample.com")).toThrow("Invalid email format");
    });

    it("should reject email without .", () => {
      expect(() => validateEmail("user@examplecom")).toThrow("Invalid email format");
    });

    it("should reject email too short", () => {
      expect(() => validateEmail("a@")).toThrow("email must be at least 3 characters");
    });

    it("should reject email too long", () => {
      const longEmail = "a".repeat(251) + "@b.c"; // 255 chars, exceeds 254 limit
      expect(() => validateEmail(longEmail)).toThrow("email must be at most 254 characters");
    });
  });

  describe("validateUrl", () => {
    it("should accept valid URLs", () => {
      expect(() => validateUrl("https://example.com")).not.toThrow();
      expect(() => validateUrl("http://localhost:3000")).not.toThrow();
      expect(() => validateUrl("https://sub.domain.com/path?query=1")).not.toThrow();
    });

    it("should reject invalid URLs", () => {
      expect(() => validateUrl("not-a-url")).toThrow("must be a valid URL");
      expect(() => validateUrl("example.com")).toThrow("must be a valid URL");
    });

    it("should reject empty URL", () => {
      expect(() => validateUrl("")).toThrow("must be at least 1 characters");
    });

    it("should reject URL too long", () => {
      const longUrl = "https://example.com/" + "a".repeat(2030);
      expect(() => validateUrl(longUrl)).toThrow("must be at most 2048 characters");
    });

    it("should use custom field name in error", () => {
      expect(() => validateUrl("bad", "website")).toThrow("website must be a valid URL");
    });
  });

  describe("validate object", () => {
    describe("validate.projectKey", () => {
      it("should validate project keys", () => {
        expect(() => validate.projectKey("PROJ")).not.toThrow();
        expect(() => validate.projectKey("A")).toThrow();
      });
    });

    describe("validate.name", () => {
      it("should validate names within limits", () => {
        expect(() => validate.name("My Project")).not.toThrow();
      });

      it("should reject empty name", () => {
        expect(() => validate.name("")).toThrow("name must be at least 1 characters");
      });

      it("should reject name over 100 chars", () => {
        expect(() => validate.name("a".repeat(101))).toThrow("name must be at most 100 characters");
      });

      it("should use custom field name", () => {
        expect(() => validate.name("", "teamName")).toThrow(
          "teamName must be at least 1 characters",
        );
      });
    });

    describe("validate.title", () => {
      it("should validate titles within limits", () => {
        expect(() => validate.title("Issue Title")).not.toThrow();
      });

      it("should reject empty title", () => {
        expect(() => validate.title("")).toThrow("title must be at least 1 characters");
      });

      it("should reject title over 200 chars", () => {
        expect(() => validate.title("a".repeat(201))).toThrow(
          "title must be at most 200 characters",
        );
      });
    });

    describe("validate.description", () => {
      it("should validate descriptions within limits", () => {
        expect(() => validate.description("A longer description")).not.toThrow();
      });

      it("should accept empty description", () => {
        expect(() => validate.description("")).not.toThrow();
      });

      it("should accept undefined description", () => {
        expect(() => validate.description(undefined)).not.toThrow();
      });

      it("should reject description over 10000 chars", () => {
        expect(() => validate.description("a".repeat(10001))).toThrow(
          "description must be at most 10000 characters",
        );
      });
    });

    describe("validate.tags", () => {
      it("should validate tags array within limits", () => {
        expect(() => validate.tags(["bug", "feature"])).not.toThrow();
      });

      it("should accept empty tags", () => {
        expect(() => validate.tags([])).not.toThrow();
      });

      it("should reject more than 50 tags", () => {
        const manyTags = Array(51).fill("tag");
        expect(() => validate.tags(manyTags)).toThrow("tags must have at most 50 items");
      });
    });

    describe("validate.bulkIds", () => {
      it("should validate bulk IDs within limits", () => {
        expect(() => validate.bulkIds(["id1", "id2"])).not.toThrow();
      });

      it("should reject empty bulk IDs", () => {
        expect(() => validate.bulkIds([])).toThrow("ids must have at least 1 items");
      });

      it("should reject more than 100 bulk IDs", () => {
        const manyIds = Array(101).fill("id");
        expect(() => validate.bulkIds(manyIds)).toThrow("ids must have at most 100 items");
      });
    });

    describe("validate.url", () => {
      it("should validate URLs", () => {
        expect(() => validate.url("https://example.com")).not.toThrow();
      });

      it("should accept undefined URL", () => {
        expect(() => validate.url(undefined)).not.toThrow();
      });

      it("should reject invalid URL", () => {
        expect(() => validate.url("not-valid")).toThrow("must be a valid URL");
      });
    });

    describe("validate.email", () => {
      it("should validate emails", () => {
        expect(() => validate.email("test@example.com")).not.toThrow();
      });

      it("should reject invalid email", () => {
        expect(() => validate.email("invalid")).toThrow("Invalid email format");
      });
    });

    describe("validate.slug", () => {
      it("should validate slugs", () => {
        expect(() => validate.slug("my-slug")).not.toThrow();
      });

      it("should reject invalid slug", () => {
        expect(() => validate.slug("My Slug")).toThrow("must be lowercase");
      });

      it("should use custom field name", () => {
        expect(() => validate.slug("-bad", "orgSlug")).toThrow("orgSlug must be lowercase");
      });
    });
  });
});
